// Test auto-population of council fields
console.log("Testing auto-population for FIX-007");
console.log("======================================");
console.log("");
console.log("To test auto-population:");
console.log("1. Navigate to http://localhost:5173/publish/step-1");
console.log("2. Select 'New Premises Licence'");
console.log("3. Continue to Step 2 - Select 'Use structured template'");
console.log("4. In Step 3, in Authority field, type 'Sample'");
console.log("5. Select 'Sampletonborough Council - Licensing'");
console.log("");
console.log("Expected Results:");
console.log("- Authority Address: 1 Town Hall Square, Sampletonborough SB1 1AA");
console.log("- Authority Email: info@sampletonborough.gov.uk");
console.log("- Online Register URL: https://www.sampletonborough.gov.uk/licensing/register");
console.log("");
console.log("These fields should auto-populate immediately after selecting Sampletonborough.");