import React, { useEffect, useState } from "react";
import { composePremisesNotice } from "../utils/composePremisesNotice";

interface Props {
  councilEmail?: string;
  onChange: (text: string) => void;
}

export default function NoFileBuilder({ councilEmail, onChange }: Props) {
  const [licenceType, setLicenceType] = useState("new");
  const [premises, setPremises] = useState("");
  const [activities, setActivities] = useState<string[]>([]);
  const [opening, setOpening] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [seasonal, setSeasonal] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [repDeadline, setRepDeadline] = useState("");
  const [repText, setRepText] = useState("");

  useEffect(() => {
    const text = composePremisesNotice({
      licenceType,
      activities,
      openingHours: opening,
      alcoholHours: alcohol || undefined,
      seasonalVariations: seasonal || undefined,
      supervisor: supervisor || undefined,
      representationDeadline: repDeadline,
      representationText: repText || councilEmail || "",
    });
    onChange(text);
  }, [licenceType, activities, opening, alcohol, seasonal, supervisor, repDeadline, repText, councilEmail, onChange]);

  const toggleActivity = (a: string) => {
    setActivities((arr) => (arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a]));
  };

  return (
    <div className="space-y-3 mt-4">
      <div>
        <label className="block text-sm font-medium mb-1">Application Type</label>
        <select className="w-full border rounded p-2" value={licenceType} onChange={(e) => setLicenceType(e.target.value)}>
          <option value="new">New</option>
          <option value="variation">Variation</option>
          <option value="review">Review</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Premises Name</label>
        <input className="w-full border rounded p-2" value={premises} onChange={(e) => setPremises(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Activities</label>
        <div className="flex flex-col gap-1 text-sm">
          {['Supply of alcohol', 'Late night refreshment', 'Regulated entertainment'].map((a) => (
            <label key={a} className="inline-flex items-center gap-1">
              <input type="checkbox" checked={activities.includes(a)} onChange={() => toggleActivity(a)} />
              {a}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Opening Hours</label>
        <input className="w-full border rounded p-2" value={opening} onChange={(e) => setOpening(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Alcohol Hours (optional)</label>
        <input className="w-full border rounded p-2" value={alcohol} onChange={(e) => setAlcohol(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Seasonal Variations (optional)</label>
        <input className="w-full border rounded p-2" value={seasonal} onChange={(e) => setSeasonal(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Designated Premises Supervisor (optional)</label>
        <input className="w-full border rounded p-2" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Representation deadline</label>
        <input type="date" className="w-full border rounded p-2" value={repDeadline} onChange={(e) => setRepDeadline(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">How to make representations</label>
        <textarea className="w-full border rounded p-2" value={repText} onChange={(e) => setRepText(e.target.value)} />
      </div>
    </div>
  );
}
