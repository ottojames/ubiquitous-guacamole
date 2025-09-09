// src/data/councils.ts

export type Council = {
  /** Stable id (string) – slugified name by default, safe as a key */
  id: string;
  /** Human-friendly label */
  name: string;

  /** Licensing team email (public inbox) */
  licensingEmail: string;

  /** Canonical postal address for licensing representations (read-only in UI) */
  postalAddress: string;

  /** Online portal URL for licensing representations/applications, if any (read-only in UI) */
  portalUrl: string;

  /** Office hours text as the council publishes it (read-only in UI) */
  officeHours: string;

  /** Optional telephone for accessibility / help text */
  phone?: string | null;

  /** Optional GIS/geocoding: centroid lat/lng if you capture it later */
  lat?: number | null;
  lng?: number | null;

  /** Optional notes/admin – not shown to applicants */
  notes?: string | null;
};

// --- Seed data --------------------------------------------------------------
// This keeps you working *today*. It mirrors your current file (name + email),
// and sets the other fields to empty strings so your UI can render them
// read-only without letting applicants type into them.
//
// You can safely ship with these and progressively enrich them.
//
// If you later verify a council’s postal address / portal / hours, just update
// the matching entry below (or use the MERGE helper at the bottom).

const SEED_LEGACY: Array<{ name: string; email: string }> = [
  { name: "Anglesey", email: "licensing@anglesey.gov.uk" },
  { name: "Allerdale", email: "licensing@allerdale.gov.uk" },
  { name: "Amber Valley BC", email: "licensing@ambervalley.gov.uk" },
  { name: "Arun District Council", email: "licensing@arun.gov.uk" },
  { name: "Ashfield", email: "licensing@ashfield-dc.gov.uk" },
  { name: "Ashford Borough Council", email: "licensing@ashford.gov.uk" },
  { name: "Aylesbury", email: "licensing@aylesburyvaledc.gov.uk" },
  { name: "Aberdeen", email: "pi@aberdeen.gov.uk" },
  { name: "Barrow", email: "commercial@barrowbc.gov.uk" },
  { name: "Barking & Dagenhamm", email: "licensing@lbbd.gov.uk" },
  { name: "Basingstoke", email: "licensing@basingstoke.gov.uk" },
  { name: "Barnsley", email: "regulatoryservices@barnsley.gov.uk" },
  { name: "Barnet", email: "licensingadmin@barnet.gov.uk" },
  { name: "Basildon", email: "licensing@basildon.gov.uk" },
  { name: "Bath and North Somerset", email: "licensing@bathnes.gov.uk" },
  { name: "Bexley Council", email: "licensing.office@bexley.gov.uk" },
  { name: "Birmingham", email: "Licensing@birmingham.gov.uk" },
  { name: "Blackburn", email: "licensing@blackburn.gov.uk" },
  { name: "Blackpool", email: "licensing.la2003@blackpool.gov.uk" },
  { name: "Bracknell Forest", email: "licence.all@bracknell-forest.gov.uk" },
  { name: "Brent", email: "environmentandprotection@brent.gov.uk" },
  { name: "Bridgend", email: "licensing@bridgend.gov.uk" },
  { name: "Brighton", email: "ehl.safety@brighton-hove.gov.uk" },
  { name: "Bristol", email: "licensing@bristol.gov.uk" },
  { name: "Broadland DC", email: "licensing@broadland.gov.uk" },
  { name: "Bedfordshire (Central)", email: "licensing.section@centralbedfordshire.gov.uk" },
  { name: "Bedford Borough Council", email: "Licensing@bedford.gov.uk" },
  { name: "Breckland", email: "contactus@breckland.gov.uk" },
  { name: "Broxtowe", email: "licensing@broxtowe.gov.uk" },
  { name: "Broxbourne", email: "licensing@broxbourne.gov.uk" },
  { name: "Bromsgrove", email: "licensing@bromsgrove.gov.uk" },
  { name: "Bradford", email: "licensingteam@bradford.gov.uk" },
  { name: "Bolton", email: "licensing.unit@bolton.gov.uk" },
  { name: "Bromley", email: "licensing@bromley.gov.uk" },
  { name: "Braintree", email: "licensing@braintree.gov.uk" },
  { name: "Bury", email: "licensing@bury.gov.uk" },
  { name: "Burnley", email: "licensing@burnley.gov.uk" },
  { name: "Bolsover", email: "licensing@bolsover.gov.uk" },
  { name: "Boston", email: "licensing@boston.gov.uk" },
  { name: "Bournemouth", email: "Licensing@bournemouth.gov.uk" },
  { name: "Broadlane", email: "environ.enforcement@broadland.gov.uk" },
  { name: "Buckinghamshire", email: "licensing@buckinghamshire.gov.uk" },
  { name: "Carmarthenshire", email: "direct@carmarthenshire.gov.uk" },
  { name: "Caerphilly", email: "licensing@caerphilly.gov.uk" },
  { name: "Cambridge", email: "licensing@cambridge.gov.uk" },
  { name: "Calderdale", email: "licensing@calderdale.gov.uk" },
  { name: "Canterbury", email: "envhealth@canterbury.gov.uk" },
  { name: "Cannock Chase", email: "licensingunit@cannockchasedc.gov.uk" },
  { name: "Cardiff", email: "licensing@cardiff.gov.uk" },
  { name: "Carlisle", email: "licensing@carlisle.gov.uk" },
  { name: "Camden Council", email: "licensing.safety@camden.gov.uk" },
  { name: "Castlepoint B.C", email: "licensingunit@castlepoint.gov.uk" },
  { name: "Central Bedfordshire", email: "customer.services@centralbedfordshire.gov.uk" },
  { name: "Ceredigion", email: "licensing@ceredigion.gov.uk" },
  { name: "Charnwood", email: "licensing@charnwood.gov.uk" },
  { name: "Chelmsford", email: "licensing@chelmsford.gov.uk" },
  { name: "Cheltenham", email: "Licensing@cheltenham.gov.uk" },
  { name: "Cherwell District council", email: "licensing@cherwell-dc.gov.uk" },
  { name: "Chesterfield", email: "licensing@chesterfield.gov.uk" },
  { name: "Cheshire East", email: "licensing@cheshireeast.gov.uk" },
  { name: "Cheshire west & Chester", email: "licensing2@cheshirewestandchester.gov.uk" },
  { name: "Chiltern", email: "licensing@chiltern.gov.uk" },
  { name: "Chorley", email: "contact@chorley.gov.uk" },
  { name: "City of London", email: "Licensing@cityoflondon.gov.uk" },
  { name: "Cornwall", email: "licensing@cornwall.gov.uk" },
  { name: "Coventry", email: "licensing@coventry.gov.uk" },
  { name: "Conwy Borough Council", email: "regulatory.services@conwy.gov.uk" },
  { name: "Cotswold DC", email: "licensing@cotswold.gov.uk" },
  { name: "Copeland", email: "Licensing@Copeland.gov.uk" },
  { name: "Cherwell", email: "licensing@cherwell-dc.gov.uk" },
  { name: "Crawley", email: "licensing@crawley.gov.uk" },
  { name: "Colchester", email: "customerservicecentre@colchester.gov.uk" },
  { name: "Craven", email: "environmentalhealth@cravendc.gov.uk" },
  { name: "Croydon", email: "licensing@croydon.gov.uk" },
  { name: "Cleveland and Redcar", email: "licensingadmin@redcar-cleveland.gov.uk" },
  { name: "Darlington", email: "licensing@darlington.gov.uk" },
  { name: "Dartford", email: "licensing@dartford.gov.uk" },
  { name: "Dacorum", email: "licensing@dacorum.gov.uk" },
  { name: "Derby", email: "licensing@derby.gov.uk" },
  { name: "Derbyshire", email: "licensing@derbyshiredales.gov.uk" },
  { name: "Derbyshire (North East)", email: "licensing@ne-derbyshire.gov.uk" },
  { name: "Devon", email: "licensing@middevon.gov.uk" },
  { name: "Doncaster", email: "licensing@doncaster.gov.uk" },
  { name: "Dover", email: "licensing@dover.gov.uk" },
  { name: "Denbighshire", email: "licensing@denbighshire.gov.uk" },
  { name: "Dudley", email: "liquor.licensing@dudley.gov.uk" },
  { name: "Dundee", email: "licensing.board@dundeecity.gov.uk" },
  { name: "Durham", email: "licensing@durham.gov.uk" },
  { name: "East Cambridgeshire", email: "licensing@eastcambs.gov.uk" },
  { name: "East Dorset", email: "licensingteam@eastdorsetdc.gov.uk" },
  { name: "East Devon", email: "licensing@eastdevon.gov.uk" },
  { name: "East Hampshire DC", email: "licensing@easthants.gov.uk" },
  { name: "East Hertfordshire DC", email: "community.protection@eastherts.gov.uk" },
  { name: "East Lindsey Council", email: "licensing@e-lindsey.gov.uk" },
  { name: "East Northamptonshire", email: "licensingunit@east-northamptonshire.gov.uk" },
  { name: "East Riding", email: "licensing@eastriding.gov.uk" },
  { name: "Eastleigh", email: "liquor.licence@eastleigh.gov.uk" },
  { name: "Eden District", email: "admin.licensing@eden.gov.uk" },
  { name: "Erewash", email: "licensing@erewash.gov.uk" },
  { name: "Ealing", email: "licensing@ealing.gov.uk" },
  { name: "Elmbridge", email: "envhealth@elmbridge.gov.uk" },
  { name: "Enfield", email: "licensing@enfield.gov.uk" },
  { name: "Epping Forest", email: "licensing@eppingforestdc.gov.uk" },
  { name: "Epsom & Ewell Borough council", email: "licensing@epsom-ewell.gov.uk" },
  { name: "Exeter", email: "licensing.team@exeter.gov.uk" },
  { name: "Eastbourne", email: "licensing@eastbourne.gov.uk" },
  { name: "Fareham", email: "customerservices@fareham.gov.uk" },
  { name: "Flintshire", email: "licensing@flintshire.gov.uk" },
  { name: "Forest Heath", email: "licensing@forest-heath.gov.uk" },
  { name: "Fylde", email: "licensing@fylde.gov.uk" },
  { name: "Fenland", email: "licensing@fenland.gov.uk" },
  { name: "Gateshead", email: "licensing@gateshead.gov.uk" },
  { name: "Glasgow", email: "LicensingBoard@ced.glasgow.gov.uk" },
  { name: "Gloucester", email: "licence.team@gloucester.gov.uk" },
  { name: "Gosport", email: "ehs@gosport.gov.uk" },
  { name: "Guildford", email: "licensing@guildford.gov.uk" },
  { name: "Gravesham", email: "licensing@gravesham.gov.uk" },
  { name: "Greenwich", email: "licensing@royalgreenwich.gov.uk" },
  { name: "Great Yarmouth", email: "licensing@great-yarmouth.gov.uk" },
  { name: "Gwent", email: "licensing@blaenau-gwent.gov.uk" },
  { name: "Gwynedd", email: "trwyddedu@gwynedd.gov.uk" },
  { name: "Gedling:", email: "licensing@gedling.gov.uk" },
  { name: "Halton Borough Council", email: "hdl@halton.gov.uk" },
  { name: "Hambleton District Council", email: "licensingteam@hambleton.gov.uk" },
  { name: "Hackney", email: "licensing@hackney.gov.uk" },
  { name: "Harborough", email: "licensing@harborough.gov.uk" },
  { name: "Harlow", email: "licensing@harlow.gov.uk." },
  { name: "Hart", email: "licence@hart.gov.uk" },
  { name: "Haringey Council", email: "licensing@haringey.gov.uk" },
  { name: "Hammersmith & Fulham", email: "licensing@lbhf.gov.uk" },
  { name: "Hastings", email: "licensing@hastings.gov.uk" },
  { name: "Harrogate", email: "licensing@harrogate.gov.uk" },
  { name: "Hartlepool", email: "licensing@hartlepool.gov.uk" },
  { name: "Havering (London Borough)", email: "licensing@havering.gov.uk" },
  { name: "Havant BC", email: "licensing@havant.gov.uk" },
  { name: "Herefordshire", email: "licensing@herefordshire.gov.uk" },
  { name: "Hertsmere", email: "licensing@hertsmere.gov.uk" },
  { name: "Harrow:", email: "licensing@harrow.gov.uk" },
  { name: "Hertfordshire", email: "licensing@hertfordshire.gov.uk" },
  { name: "High Peak Borough", email: "customer-services@highpeak.gov.uk" },
  { name: "Hinckley & Bosworth", email: "esadmin@hinckley-bosworth.gov.uk" },
  { name: "Hinckley & Bosworth", email: "licensing@hillingdon.gov.uk" },
  { name: "Hounslow", email: "licensing@hounslow.gov.uk" },
  { name: "Hull", email: "licensing.requests@hullcc.gov.uk" },
  { name: "Huntingdonshire DC", email: "licensing@huntingdonshire.gov.uk" },
  { name: "Hyndburn BC", email: "enquiries@hyndburnbc.gov.uk" },
  { name: "Harrow", email: "licensing@harrow.gov.uk" },
  { name: "Horsham District Council", email: "licensing@horsham.gov.uk" },
  { name: "Inverclyde", email: "comments@inverclyde.gov.uk" },
  { name: "Isle of Wight", email: "licensing@iow.gov.uk" },
  { name: "Ipswich", email: "licensingandenforcement@ipswich.gov.uk" },
  { name: "Islington", email: "licensing@islington.gov.uk" },
  { name: "Kensington & Chelsea", email: "licensing@rbkc.gov.uk" },
  { name: "Kettering", email: "licensing@kettering.gov.uk" },
  { name: "Kings Lynn & Norfolk", email: "ehlicensing@west-norfolk.gov.uk" },
  { name: "Kirklees", email: "licensing@kirklees.gov.uk" },
  { name: "Kingston Upon Thames", email: "licensing@kingston.gov.uk" },
  { name: "Knowsley Borough Council", email: "licensing@knowsley.gov.uk" },
  { name: "Lambeth", email: "licensing@lambeth.gov.uk" },
  { name: "Lichfield", email: "licensing@lichfielddc.gov.uk" },
  { name: "Luton Council", email: "licensing@luton.gov.uk" },
  { name: "Leicester", email: "licensing@leicester.gov.uk" },
  { name: "Lancaster", email: "licensing@lancaster.gov.uk" },
  { name: "Lewes", email: "ehealth@lewes.gov.uk" },
  { name: "Lewisham", email: "licensing@lewisham.gov.uk" },
  { name: "Lincoln", email: "licensing@lincoln.gov.uk" },
  { name: "Liverpool", email: "licensing@liverpool.gov.uk" },
  { name: "Melton", email: "licensing@melton.gov.uk" },
  { name: "Maidstone", email: "licensing@maidstone.gov.uk" },
  { name: "Malden", email: "licensing@maldon.gov.uk" },
  { name: "Malvern Hills", email: "licensing@malvernhills.gov.uk" },
  { name: "Mansfield", email: "licensing@mansfield.gov.uk" },
  { name: "London Borough of Merton", email: "licensing@merton.gov.uk" },
  { name: "Mendip DC", email: "customerservices@mendip.gov.uk" },
  { name: "Middlesbrough Council", email: "licensing@middlesbrough.gov.uk" },
  { name: "Mid Devon DC", email: "licensing@middevon.gov.uk" },
  { name: "Mid Sussex", email: "licensing@midsussex.gov.uk" },
  { name: "Mid Suffolk", email: "Licensing@midsuffolk.gov.uk" },
  { name: "Manchester", email: "premises.licensing@manchester.gov.uk" },
  { name: "Milton Keynes", email: "licensing@milton-keynes.gov.uk" },
  { name: "Medway", email: "licensing@medway.gov.uk" },
  { name: "Monmouthshire", email: "licensing@monmouthshire.gov.uk" },
  { name: "Neath Port Talbot", email: "licensing@npt.gov.uk" },
  { name: "Newark & Sherwood", email: "request@nsdc.info" },
  { name: "Newcastle", email: "licensing@newcastle.gov.uk" },
  { name: "Newcastle under Lyme BC", email: "licensing@newcastle-staffs.gov.uk" },
  { name: "Newham", email: "Licensing@newham.gov.uk" },
  { name: "New Forest", email: "licensing@nfdc.gov.uk" },
  { name: "Newport", email: "environment.licensing@newport.gov.uk" },
  { name: "North Dorset", email: "envlicens@north-dorset.gov.uk" },
  { name: "North Warwickshire", email: "customerservices@northwarks.gov.uk" },
  { name: "North East Lincs", email: "licensing@nelincs.gov.uk" },
  { name: "North Hertfordshire", email: "licensing@north-herts.gov.uk" },
  { name: "Northampton", email: "licensing@northampton.gov.uk" },
  { name: "North West Leicestershire", email: "licensing@nwleicestershire.gov.uk" },
  { name: "North West Leicestershire", email: "licensing@northlincs.gov.uk" },
  { name: "North Lincolnshire", email: "customerservice@northlincs.gov.uk" },
  { name: "North East Lincolnshire", email: "licensing@nelincs.gov.uk" },
  { name: "North Norfolk", email: "licensing@north-norfolk.gov.uk" },
  { name: "Northumberland", email: "licensing@northumberland.gov.uk" },
  { name: "North Devon Council", email: "customerservices@northdevon.gov.uk" },
  { name: "North Herts", email: "service@north-herts.gov.uk" },
  { name: "North Tyneside", email: "liquor.licensing@northtyneside.gov.uk" },
  { name: "Nottingham", email: "general.licensing@nottinghamcity.gov.uk" },
  { name: "Newham", email: "licensingregistration@newham.gov.uk" },
  { name: "Norwich", email: "licensing@norwich.gov.uk" },
  { name: "Newcastle under Lyme", email: "licensing@newcastle-staffs.gov.uk" },
  { name: "North West", email: "licensing@nwleicestershire.gov.uk" },
  { name: "North Somerset", email: "licensing@n-somerset.gov.uk" },
  { name: "North Kesteven:", email: "licensing@n-kesteven.gov.uk" },
  { name: "Oldham Council", email: "licensing@oldham.gov.uk" },
  { name: "Oxford Council", email: "licensing@oxford.gov.uk" },
  { name: "Oadby and Wigston", email: "licensing@oadby-wigston.gov.uk" },
  { name: "Pendle", email: "dls@pendle.gov.uk" },
  { name: "Pembrokeshire", email: "lic@pembrokeshire.gov.uk" },
  { name: "Preston Council", email: "licensing@preston.gov.uk" },
  { name: "Plymouth", email: "licensing@plymouth.gov.uk" },
  { name: "Portsmouth", email: "licensing@portsmouthcc.gov.uk" },
  { name: "Powys", email: "public.protection@powys.gov.uk" },
  { name: "Reading", email: "licensing@reading.gov.uk" },
  { name: "Redditch", email: "licensing@redditchbc.gov.uk" },
  { name: "Reigate", email: "licensing@reigate-banstead.gov.uk" },
  { name: "Redcar & Cleveland BC", email: "licensing_admin@redcar-cleveland.gov.uk" },
  { name: "Richmondshire", email: "licensingteam@richmondshire.gov.uk" },
  { name: "(London Borough)", email: "licensing@richmond.gov.uk" },
  { name: "Rhondda", email: "Licensing.Section@rhondda-cynon-taff.gov.uk" },
  { name: "Rhondda", email: "Licensing.section@rctcbc.gov.uk" },
  { name: "Rossendale BC", email: "licensing@rossendalebc.gov.uk" },
  { name: "Rochdale", email: "licensing.reg@rochdale.gov.uk" },
  { name: "Rushcliffe BC", email: "licensing@rushcliffe.gov.uk" },
  { name: "Rushmoor", email: "licensing@rushmoor.gov.uk" },
  { name: "Peterborough & Rutland", email: "rcclicensing@peterborough.gov.uk" },
  { name: "Peterborough & Rutland", email: "licensing@runnymede.gov.uk" },
  { name: "Ryedale", email: "envhealth@ryedale.gov.uk" },
  { name: "Rugby", email: "licensing@rugby.gov.uk" },
  { name: "Redbridge", email: "Licensing.Authority@redbridge.gov.uk" },
  { name: "Rochford Council", email: "licensing@rochford.gov.uk" },
  { name: "Sandwell", email: "licensing_team@sandwell.gov.uk" },
  { name: "Salford", email: "licensing@salford.gov.uk" },
  { name: "Scarborough", email: "licensing.services@scarborough.gov.uk" },
  { name: "Sedgemoor", email: "customer.services@sedgemoor.gov.uk" },
  { name: "Selby", email: "licensingsection@selby.gov.uk" },
  { name: "Sevenoaks", email: "licensing@sevenoaks.gov.uk" },
  { name: "Shepway", email: "licensing@shepway.gov.uk" },
  { name: "Solihull", email: "licensing@solihull.gov.uk" },
  { name: "Suffolk", email: "licensing@suffolkcoastal.gov.uk" },
  { name: "Sefton Council", email: "Licensing@sefton.gov.uk" },
  { name: "Sheffield", email: "licensingservice@sheffield.gov.uk" },
  { name: "Shropshire", email: "licensing@shropshire.gov.uk" },
  { name: "South Ribble", email: "licensing@southribble.gov.uk" },
  { name: "Swansea", email: "evh.licensing@swansea.gov.uk" },
  { name: "Southend on Sea", email: "licact2003@southend.gov.uk" },
  { name: "South Bucks DC", email: "licensing@SouthBucks.Gov.uk" },
  { name: "South Tyneside", email: "Licensing@southtyneside.gov.uk" },
  { name: "South Cambs DC", email: "licensing@scambs.gov.uk" },
  { name: "South Gloucestershire", email: "licensing@southglos.gov.uk" },
  { name: "South Hams", email: "licensing@southhams.gov.uk" },
  { name: "Southampton", email: "licensing@southampton.gov.uk" },
  { name: "South Holland", email: "licensing@sholland.gov.uk" },
  { name: "South Kesteven DC", email: "licensing@southkesteven.gov.uk" },
  { name: "South Lakeland", email: "licensing@southlakeland.gov.uk" },
  { name: "South Lanarkshire", email: "licensing@southlanarkshire.gov.uk" },
  { name: "South Norfolk", email: "licensingteam@s-norfolk.gov.uk" },
  { name: "South Northamptonshire", email: "licensing@southnorthants.gov.uk" },
  { name: "Spelthorne", email: "Licensing@spelthorne.gov.uk" },
  { name: "Stafford", email: "ehlicensing@staffordbc.gov.uk" },
  { name: "St Edmundsbury", email: "licensing@stedsbc.gov.uk" },
  { name: "Staffordshire Moorlands", email: "licensing@staffsmoorlands.gov.uk" },
  { name: "Stevenage", email: "licensing@stevenage.gov.uk" },
  { name: "Stoke on Trent City Council", email: "hcp.licensing@stoke.gov.uk" },
  { name: "Stockport", email: "licensing2003@stockport.gov.uk" },
  { name: "Stratford on Avon", email: "licensing@stratford-dc.gov.uk" },
  { name: "Stroud", email: "licensing@stroud.gov.uk" },
  { name: "Somerset", email: "licensing@southsomerset.gov.uk" },
  { name: "Slough", email: "enquires@slough.gov.uk" },
  { name: "Sunderland", email: "licensing@sunderland.gov.uk" },
  { name: "Southwark", email: "licensing@southwark.gov.uk" },
  { name: "South Derbyshire", email: "licensing@southderbyshire.gov.uk" },
  { name: "Stockton", email: "licensing.administration@stockton.gov.uk" },
  { name: "Swale", email: "licensing@swale.gov.uk" },
  { name: "Swindon", email: "licensing@swindon.gov.uk" },
  { name: "St Helens", email: "generallicensing@sthelens.gov.uk" },
  { name: "London Borough of Sutton", email: "licensing@sutton.gov.uk" },
  { name: "Sefton", email: "Licensing@sefton.gov.uk" },
  { name: "St Albans", email: "licensing@stalbans.gov.uk" },
  { name: "Tameside", email: "licensing@tameside.gov.uk" },
  { name: "Tamworth", email: "envhealthadmin@tamworth.gov.uk" },
  { name: "Tandridge District Council", email: "eh@tandridge.gov.uk" },
  { name: "Telford & Wrekin", email: "licensing@telford.gov.uk" },
  { name: "Tendring", email: "licensingsection@tendringdc.gov.uk" },
  { name: "Tewsbury", email: "licensing@tewkesbury.gov.uk" },
  { name: "Thurrock", email: "licensing@thurrock.gov.uk" },
  { name: "Tower Hamlets", email: "licensing@towerhamlets.gov.uk" },
  { name: "Torridge", email: "licensing@torridge.gov.uk" },
  { name: "Trafford", email: "licensing@trafford.gov.uk" },
  { name: "Thanet", email: "licensing@thanet.gov.uk" },
  { name: "Torbay", email: "licensing@torbay.gov.uk" },
  { name: "Taunton", email: "licensing@tauntondeane.gov.uk" },
  { name: "Tonbridge & Malling", email: "licensing.services@tmbc.gov.uk" },
  { name: "Tonbridge & Malling", email: "licensing@torfaen.gov.uk" },
  { name: "Uttlesford", email: "licensing@uttlesford.gov.uk" },
  { name: "Vale of White Horse District Council", email: "licensing.unit@whitehorsedc.gov.uk" },
  { name: "Vale of Glamorgan", email: "Licensing@valeofglamorgan.gov.uk" },
  { name: "Waverley", email: "licensing.policy@waverley.gov.uk" },
  { name: "Wakefield", email: "LicensingOffice@wakefield.gov.uk" },
  { name: "Waveney", email: "licensing@waveney.gov.uk" },
  { name: "Warrington", email: "cexlicensing@warrington.gov.uk" },
  { name: "Wandsworth", email: "licensing@wandsworth.gov.uk" },
  { name: "Warwick", email: "licensing@warwickdc.gov.uk" },
  { name: "Watford", email: "licensing@watford.gov.uk" },
  { name: "Waltham Forest", email: "licensing@walthamforest.gov.uk" },
  { name: "Welwyn", email: "licensing@welhat.gov.uk" },
  { name: "West Lancashire", email: "licensing.enquiries@westlancs.gov.uk" },
  { name: "West Berkshire", email: "licensing@westberks.gov.uk" },
  { name: "West Lindsey", email: "licensing.2003@west-lindsey.gov.uk" },
  { name: "West Dorset", email: "licensing@westdorset-dc.gov.uk" },
  { name: "West Oxfordshire", email: "community.services@westoxon.gov.uk" },
  { name: "Westminster (City of)", email: "premiseslicensing@westminster.gov.uk" },
  { name: "Weymouth & Portland", email: "licensing@weymouth.gov.uk" },
  { name: "Wiltshire East", email: "publicprotectioneast@wiltshire.gov.uk" },
  { name: "Wiltshire East", email: "publicprotectionwest@wiltshire.gov.uk" },
  { name: "Wiltshire South", email: "publicprotectionsouth@wiltshire.gov.uk" },
  { name: "Wycombe District Council", email: "licensing@wycombe.gov.uk" },
  { name: "Wigan", email: "Licensingact2003@wigan.gov.uk" },
  { name: "Wolverhampton", email: "licensing@wolverhampton.gov.uk" },
  { name: "Worthing", email: "licensing.unit@adur-worthing.gov.uk" },
  { name: "Woking", email: "licensing@woking.gov.uk" },
  { name: "Wokingham", email: "licensing@wokingham.gov.uk" },
  { name: "Wealden", email: "environmentalprotection@wealden.gov.uk" },
  { name: "Wirral", email: "licensing@wirral.gov.uk" },
  { name: "Walsall", email: "Licensing@walsall.gov.uk" },
  { name: "Wrexham", email: "environmental@wrexham.gov.uk" },
  { name: "Wychavon", email: "licensing@wychavon.gov.uk" },
  { name: "Wycombe", email: "licensing@wycombe.gov.uk" },
  { name: "Wyre Borough Council", email: "licensing@wyre.gov.uk" },
  { name: "Wyre Forest District Council", email: "licensing@wyreforestdc.gov.uk" },
  { name: "Winchester", email: "licensing@winchester.gov.uk" },
  { name: "West Devon", email: "licensing@westdevon.gov.uk" },
  { name: "Windsor & Maidenhead", email: "licensing@rbwm.gov.uk" },
  { name: "Worcester City", email: "wrsenquiries@worcsregservices.gov.uk" },
  { name: "York", email: "licensing.unit@york.gov.uk" },
  { name: "Chester", email: "ottoclarke@icloud.com" }
  // …continue pasting the rest of your current list here …
];

// Slug helper to form a stable id from the name
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Transform legacy (name+email) into full Council records with placeholder fields.
 * This ensures all required fields exist and your UI can rely on the shape.
 */
function fromLegacy(seed: typeof SEED_LEGACY): Council[] {
  return seed.map(({ name, email }) => ({
    id: slug(name),
    name,
    licensingEmail: email.trim(),
    postalAddress: "", // TODO: verify and populate
    portalUrl: "",     // TODO: verify and populate
    officeHours: "",   // TODO: verify and populate
    phone: null,
    lat: null,
    lng: null,
    notes: null,
  }));
}

/**
 * Merge a set of verified overrides into the base list.
 * Pass only the fields you’ve verified; others remain untouched.
 */
export function mergeCouncilUpdates(
  base: Council[],
  updates: Array<Partial<Council> & Pick<Council, "id">>
): Council[] {
  const byId = new Map(base.map((c) => [c.id, c]));
  for (const u of updates) {
    const current = byId.get(u.id);
    if (!current) continue;
    byId.set(u.id, { ...current, ...u });
  }
  return Array.from(byId.values());
}

// Example: a couple of *verified* enrichments once you have them.
// (These are placeholders — keep them empty until you’ve confirmed.)
const VERIFIED_OVERRIDES: Array<Partial<Council> & Pick<Council, "id">> = [
  // {
  //   id: "barnet",
  //   postalAddress: "Licensing Team, London Borough of Barnet, 2 Bristol Ave, London NW9 4EW",
  //   portalUrl: "https://www.barnet.gov.uk/licensing",
  //   officeHours: "Mon–Fri 9am–5pm",
  //   phone: "020 8359 7443",
  // },
];

// --- Export final list -------------------------------------------------------

const BASE = fromLegacy(SEED_LEGACY);
export const councils: Council[] = mergeCouncilUpdates(BASE, VERIFIED_OVERRIDES);

/** Convenience: quick lookup */
export const councilsById: Record<string, Council> = Object.fromEntries(
  councils.map((c) => [c.id, c])
);

/** Find by id or name */
export function findCouncil(query: string): Council | undefined {
  const q = query.trim().toLowerCase();
  return (
    councilsById[q] ||
    councils.find((c) => c.name.toLowerCase() === q) ||
    undefined
  );
}
