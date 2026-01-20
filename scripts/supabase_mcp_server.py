#!/usr/bin/env python3
"""
Minimal Supabase MCP server for Claude CLI.

The server speaks Model Context Protocol over stdio and exposes a single tool
that performs REST operations against Supabase tables using the service role
or anon key provided via environment variables (or a dotenv file).
"""

from __future__ import annotations

import json
import os
import sys
import traceback
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

import requests
from requests import Response


def debug_enabled() -> bool:
    return bool(os.environ.get("SUPABASE_MCP_DEBUG"))


def log_debug(message: str) -> None:
    if debug_enabled():
        sys.stderr.write(message.rstrip() + "\n")
        sys.stderr.flush()


def load_dotenv_if_needed(project_root: str) -> None:
    """
    Populate os.environ with values from a dotenv file if Supabase credentials
    were not already supplied.
    """

    if os.environ.get("SUPABASE_URL") and (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    ):
        return

    env_path = os.environ.get("SUPABASE_MCP_DOTENV")
    if not env_path:
        env_path = os.path.join(project_root, ".env")

    if not os.path.exists(env_path):
        return

    try:
        with open(env_path, "r", encoding="utf-8") as handle:
            for raw_line in handle:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                # Remove optional surrounding quotes.
                if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
                    value = value[1:-1]
                os.environ.setdefault(key, value)
    except Exception:  # pragma: no cover - defensive
        log_debug("Failed to read dotenv file for Supabase credentials:\n" + traceback.format_exc())


def read_message() -> Optional[Dict[str, Any]]:
    """
    Read a single JSON-RPC message framed with Content-Length headers.
    Returns None when stdin is closed.
    """

    headers: Dict[str, str] = {}
    while True:
        line = sys.stdin.buffer.readline()
        if not line:
            return None
        line = line.strip()
        if not line:
            break
        try:
            raw = line.decode("utf-8")
            key, value = raw.split(":", 1)
            headers[key.strip().lower()] = value.strip()
        except ValueError:
            continue

    if "content-length" not in headers:
        return None

    try:
        length = int(headers["content-length"])
    except ValueError:
        return None

    body = sys.stdin.buffer.read(length)
    if not body:
        return None

    try:
        return json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        log_debug("Failed to decode incoming JSON message.")
        return None


def send_message(payload: Dict[str, Any]) -> None:
    data = json.dumps(payload)
    encoded = data.encode("utf-8")
    sys.stdout.buffer.write(f"Content-Length: {len(encoded)}\r\n\r\n".encode("ascii"))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def send_error(id_value: Any, code: int, message: str, data: Optional[Any] = None) -> None:
    error_payload: Dict[str, Any] = {"jsonrpc": "2.0", "error": {"code": code, "message": message}}
    if data is not None:
        error_payload["error"]["data"] = data
    if id_value is not None:
        error_payload["id"] = id_value
    send_message(error_payload)


def sanitize_error(response: Response) -> Dict[str, Any]:
    try:
        data = response.json()
    except ValueError:
        data = {"detail": response.text}
    return {
        "status": response.status_code,
        "detail": data,
        "headers": dict(response.headers),
    }


def build_filter_params(filters: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    params: Dict[str, Any] = {}
    if not filters:
        return params

    def encode_value(raw: Any) -> str:
        if isinstance(raw, bool):
            return "true" if raw else "false"
        if raw is None:
            return "null"
        return str(raw)

    for column, spec in filters.items():
        operator = "eq"
        value: Any = spec
        if isinstance(spec, dict):
            operator = spec.get("op", "eq")
            value = spec.get("value")

        if operator.lower() == "in" and isinstance(value, (list, tuple)):
            encoded = ",".join(encode_value(v) for v in value)
            params[column] = f"in.({encoded})"
        else:
            params[column] = f"{operator}.{encode_value(value)}"
    return params


def extract_content_range(headers: Dict[str, Any]) -> Optional[Tuple[int, int, Optional[int]]]:
    content_range = headers.get("content-range")
    if not content_range:
        return None
    try:
        range_part, total_part = content_range.split("/")
        start_str, end_str = range_part.split("-")
        start = int(start_str)
        end = int(end_str)
        total = None if total_part == "*" else int(total_part)
        return (start, end, total)
    except Exception:  # pragma: no cover - defensive
        return None


@dataclass
class SupabaseConfig:
    url: str
    api_key: str

    @property
    def rest_url(self) -> str:
        return self.url.rstrip("/") + "/rest/v1"

    def headers(self, prefer: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers


class SupabaseMCPServer:
    def __init__(self) -> None:
        project_root = os.path.dirname(os.path.abspath(__file__))
        load_dotenv_if_needed(project_root)
        url = os.environ.get("SUPABASE_URL", "").strip()
        api_key = (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            or os.environ.get("SUPABASE_ANON_KEY")
            or ""
        ).strip()
        self.config = SupabaseConfig(url=url, api_key=api_key)

    @property
    def has_credentials(self) -> bool:
        return bool(self.config.url and self.config.api_key)

    def list_tools(self) -> Dict[str, Any]:
        return {
            "tools": [
                {
                    "name": "supabase_rest",
                    "description": (
                        "Run simple REST operations against a Supabase table. "
                        "Supports select, insert, upsert, update, and delete using the "
                        "service role or anon key configured for this MCP server."
                    ),
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "operation": {
                                "type": "string",
                                "enum": ["select", "insert", "upsert", "update", "delete"],
                                "default": "select",
                            },
                            "table": {
                                "type": "string",
                                "description": "Supabase table name to target.",
                            },
                            "select": {
                                "type": "string",
                                "description": "Columns clause for select queries, defaults to '*'.",
                                "default": "*",
                            },
                            "filters": {
                                "type": "object",
                                "description": (
                                    "Column filters. Use simple values for equality or objects of the "
                                    "form {'op': 'eq', 'value': ...}."
                                ),
                            },
                            "limit": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "Optional limit for select queries.",
                            },
                            "order": {
                                "type": "object",
                                "properties": {
                                    "column": {"type": "string"},
                                    "ascending": {"type": "boolean", "default": True},
                                    "nullsFirst": {"type": "boolean"},
                                },
                                "required": ["column"],
                                "description": "Ordering configuration for select queries.",
                            },
                            "data": {
                                "description": (
                                    "Payload for insert, upsert, update, or delete operations. "
                                    "Use an object for single row or an array for multiple rows."
                                ),
                            },
                            "onConflict": {
                                "type": "string",
                                "description": (
                                    "Comma separated column list for upsert on_conflict clause."
                                ),
                            },
                            "preferCount": {
                                "type": "boolean",
                                "description": "Request an exact row count (select queries).",
                                "default": False,
                            },
                        },
                        "required": ["table"],
                        "additionalProperties": True,
                    },
                }
            ]
        }

    def handle_call(self, call: Dict[str, Any]) -> Dict[str, Any]:
        name = call.get("name")
        if name != "supabase_rest":
            raise ValueError(f"Unknown tool: {name}")

        if not self.has_credentials:
            raise RuntimeError(
                "Supabase credentials are not configured. Set SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)."
            )

        arguments = call.get("arguments") or {}
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError as error:
                raise ValueError(f"Tool arguments must be JSON: {error}") from error

        operation = str(arguments.get("operation", "select")).lower()
        table = arguments.get("table")
        if not table:
            raise ValueError("Missing required 'table' argument.")

        if operation == "select":
            result = self._perform_select(arguments)
        elif operation == "insert":
            result = self._perform_insert(arguments, prefer="return=representation")
        elif operation == "upsert":
            result = self._perform_insert(
                arguments,
                prefer="resolution=merge-duplicates,return=representation",
                upsert=True,
            )
        elif operation == "update":
            result = self._perform_update(arguments)
        elif operation == "delete":
            result = self._perform_delete(arguments)
        else:
            raise ValueError(f"Unsupported operation '{operation}'.")

        text = json.dumps(result, indent=2, sort_keys=True)
        return {"content": [{"type": "text", "text": text}], "isError": False}

    def _build_common(self, args: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        table = args["table"]
        url = f"{self.config.rest_url}/{table}"
        filters = args.get("filters")
        params = build_filter_params(filters)
        return url, params

    def _perform_select(self, args: Dict[str, Any]) -> Dict[str, Any]:
        url, params = self._build_common(args)
        select_clause = args.get("select", "*")
        params["select"] = select_clause or "*"
        limit = args.get("limit")
        if isinstance(limit, int) and limit > 0:
            params["limit"] = str(limit)
        order = args.get("order")
        if isinstance(order, dict) and order.get("column"):
            ordering = order["column"]
            if not order.get("ascending", True):
                ordering += ".desc"
            if order.get("nullsFirst") is True:
                ordering += ".nullsfirst"
            elif order.get("nullsFirst") is False:
                ordering += ".nullslast"
            params["order"] = ordering

        prefer = "count=exact" if args.get("preferCount") else None
        headers = self.config.headers(prefer)

        response = requests.get(url, headers=headers, params=params, timeout=30)
        if response.status_code >= 400:
            raise RuntimeError(json.dumps(sanitize_error(response), indent=2))

        rows = response.json() if response.content else []
        range_info = extract_content_range(response.headers)
        payload = {"rows": rows}
        if range_info:
            payload["range"] = {
                "from": range_info[0],
                "to": range_info[1],
                "total": range_info[2],
            }
        return payload

    def _perform_insert(self, args: Dict[str, Any], prefer: str, upsert: bool = False) -> Dict[str, Any]:
        url, params = self._build_common(args)
        data = args.get("data")
        if data is None:
            raise ValueError("Insert/upsert operations require 'data'.")

        if upsert:
            on_conflict = args.get("onConflict")
            if on_conflict:
                params["on_conflict"] = on_conflict
            headers = self.config.headers(prefer)
        else:
            headers = self.config.headers(prefer)

        response = requests.post(url, headers=headers, params=params, json=data, timeout=30)
        if response.status_code >= 400:
            raise RuntimeError(json.dumps(sanitize_error(response), indent=2))

        payload = response.json() if response.content else {"status": response.status_code}
        return {"rows": payload}

    def _perform_update(self, args: Dict[str, Any]) -> Dict[str, Any]:
        url, params = self._build_common(args)
        data = args.get("data")
        if data is None:
            raise ValueError("Update operations require 'data'.")
        if not params:
            raise ValueError("Update operations require filters to avoid mass updates.")

        headers = self.config.headers("return=representation")
        response = requests.patch(url, headers=headers, params=params, json=data, timeout=30)
        if response.status_code >= 400:
            raise RuntimeError(json.dumps(sanitize_error(response), indent=2))

        payload = response.json() if response.content else {"status": response.status_code}
        return {"rows": payload}

    def _perform_delete(self, args: Dict[str, Any]) -> Dict[str, Any]:
        url, params = self._build_common(args)
        if not params:
            raise ValueError("Delete operations require filters to avoid deleting entire tables.")

        headers = self.config.headers("return=representation")
        response = requests.delete(url, headers=headers, params=params, timeout=30)
        if response.status_code >= 400:
            raise RuntimeError(json.dumps(sanitize_error(response), indent=2))

        payload = response.json() if response.content else {"status": response.status_code}
        return {"rows": payload}


def main() -> None:
    server = SupabaseMCPServer()

    while True:
        message = read_message()
        if message is None:
            break

        method = message.get("method")
        msg_id = message.get("id")

        try:
            if method == "initialize":
                send_message(
                    {
                        "jsonrpc": "2.0",
                        "id": msg_id,
                        "result": {
                            "capabilities": {
                                "tools": {"list": True, "call": True},
                                "completion": False,
                            }
                        },
                    }
                )
            elif method == "shutdown":
                send_message({"jsonrpc": "2.0", "id": msg_id, "result": None})
            elif method == "ping":
                send_message({"jsonrpc": "2.0", "id": msg_id, "result": {"ok": True}})
            elif method == "tools/list":
                send_message({"jsonrpc": "2.0", "id": msg_id, "result": server.list_tools()})
            elif method == "tools/call":
                params = message.get("params") or {}
                call = params.get("call") or params
                if not isinstance(call, dict):
                    raise ValueError("tools/call expects an object payload.")
                result = server.handle_call(call)
                send_message({"jsonrpc": "2.0", "id": msg_id, "result": result})
            elif method == "initialized":
                # Notification; nothing to do.
                continue
            elif method == "$/setTrace":
                # Optional tracing notification; acknowledge.
                continue
            elif method == "exit":
                break
            else:
                send_error(msg_id, -32601, f"Method '{method}' not implemented.")
        except Exception as exc:  # pragma: no cover - runtime safety
            log_debug("Unhandled exception:\n" + traceback.format_exc())
            send_message(
                {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "content": [{"type": "text", "text": str(exc)}],
                        "isError": True,
                    },
                }
            )


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
