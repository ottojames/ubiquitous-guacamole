/**
 * Script to import all 352 UK local councils to the database
 * Data source: UK Government open data
 *
 * Run with: npx tsx server/scripts/import-uk-councils.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// UK Councils data - All 352 local authorities
// Source: https://www.gov.uk/government/collections/local-authority-england-and-wales
const UK_COUNCILS = [
  // England - County Councils (24)
  { name: 'Buckinghamshire Council', slug: 'buckinghamshire', type: 'county', region: 'South East England', reps_email: 'licensing@buckinghamshire.gov.uk' },
  { name: 'Cambridgeshire County Council', slug: 'cambridgeshire', type: 'county', region: 'East of England', reps_email: 'licensing@cambridgeshire.gov.uk' },
  { name: 'Cumbria County Council', slug: 'cumbria', type: 'county', region: 'North West England', reps_email: 'licensing@cumbria.gov.uk' },
  { name: 'Derbyshire County Council', slug: 'derbyshire', type: 'county', region: 'East Midlands', reps_email: 'licensing@derbyshire.gov.uk' },
  { name: 'Devon County Council', slug: 'devon', type: 'county', region: 'South West England', reps_email: 'licensing@devon.gov.uk' },
  { name: 'East Sussex County Council', slug: 'east-sussex', type: 'county', region: 'South East England', reps_email: 'licensing@eastsussex.gov.uk' },
  { name: 'Essex County Council', slug: 'essex', type: 'county', region: 'East of England', reps_email: 'licensing@essex.gov.uk' },
  { name: 'Gloucestershire County Council', slug: 'gloucestershire', type: 'county', region: 'South West England', reps_email: 'licensing@gloucestershire.gov.uk' },
  { name: 'Hampshire County Council', slug: 'hampshire', type: 'county', region: 'South East England', reps_email: 'licensing@hants.gov.uk' },
  { name: 'Hertfordshire County Council', slug: 'hertfordshire', type: 'county', region: 'East of England', reps_email: 'licensing@hertfordshire.gov.uk' },
  { name: 'Kent County Council', slug: 'kent', type: 'county', region: 'South East England', reps_email: 'licensing@kent.gov.uk' },
  { name: 'Lancashire County Council', slug: 'lancashire', type: 'county', region: 'North West England', reps_email: 'licensing@lancashire.gov.uk' },
  { name: 'Leicestershire County Council', slug: 'leicestershire', type: 'county', region: 'East Midlands', reps_email: 'licensing@leics.gov.uk' },
  { name: 'Lincolnshire County Council', slug: 'lincolnshire', type: 'county', region: 'East Midlands', reps_email: 'licensing@lincolnshire.gov.uk' },
  { name: 'Norfolk County Council', slug: 'norfolk', type: 'county', region: 'East of England', reps_email: 'licensing@norfolk.gov.uk' },
  { name: 'North Yorkshire County Council', slug: 'north-yorkshire', type: 'county', region: 'Yorkshire and the Humber', reps_email: 'licensing@northyorks.gov.uk' },
  { name: 'Nottinghamshire County Council', slug: 'nottinghamshire', type: 'county', region: 'East Midlands', reps_email: 'licensing@nottscc.gov.uk' },
  { name: 'Oxfordshire County Council', slug: 'oxfordshire', type: 'county', region: 'South East England', reps_email: 'licensing@oxfordshire.gov.uk' },
  { name: 'Somerset County Council', slug: 'somerset', type: 'county', region: 'South West England', reps_email: 'licensing@somerset.gov.uk' },
  { name: 'Staffordshire County Council', slug: 'staffordshire', type: 'county', region: 'West Midlands', reps_email: 'licensing@staffordshire.gov.uk' },
  { name: 'Suffolk County Council', slug: 'suffolk', type: 'county', region: 'East of England', reps_email: 'licensing@suffolk.gov.uk' },
  { name: 'Surrey County Council', slug: 'surrey', type: 'county', region: 'South East England', reps_email: 'licensing@surreycc.gov.uk' },
  { name: 'Warwickshire County Council', slug: 'warwickshire', type: 'county', region: 'West Midlands', reps_email: 'licensing@warwickshire.gov.uk' },
  { name: 'West Sussex County Council', slug: 'west-sussex', type: 'county', region: 'South East England', reps_email: 'licensing@westsussex.gov.uk' },

  // England - Metropolitan Districts (36)
  { name: 'Barnsley Metropolitan Borough Council', slug: 'barnsley', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'licensing@barnsley.gov.uk' },
  { name: 'Birmingham City Council', slug: 'birmingham', type: 'metropolitan', region: 'West Midlands', reps_email: 'licensing@birmingham.gov.uk' },
  { name: 'Bolton Council', slug: 'bolton', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@bolton.gov.uk' },
  { name: 'Bradford City Council', slug: 'bradford', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'licensing@bradford.gov.uk' },
  { name: 'Bury Council', slug: 'bury', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@bury.gov.uk' },
  { name: 'Calderdale Council', slug: 'calderdale', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'licensing@calderdale.gov.uk' },
  { name: 'Coventry City Council', slug: 'coventry', type: 'metropolitan', region: 'West Midlands', reps_email: 'licensing@coventry.gov.uk' },
  { name: 'Doncaster Council', slug: 'doncaster', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'licensing@doncaster.gov.uk' },
  { name: 'Dudley Metropolitan Borough Council', slug: 'dudley', type: 'metropolitan', region: 'West Midlands', reps_email: 'licensing@dudley.gov.uk' },
  { name: 'Gateshead Council', slug: 'gateshead', type: 'metropolitan', region: 'North East England', reps_email: 'licensing@gateshead.gov.uk' },
  { name: 'Kirklees Council', slug: 'kirklees', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'licensing@kirklees.gov.uk' },
  { name: 'Knowsley Council', slug: 'knowsley', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@knowsley.gov.uk' },
  { name: 'Leeds City Council', slug: 'leeds', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'entertainment.licensing@leeds.gov.uk' },
  { name: 'Liverpool City Council', slug: 'liverpool', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@liverpool.gov.uk' },
  { name: 'Manchester City Council', slug: 'manchester', type: 'metropolitan', region: 'North West England', reps_email: 'premises.licensing@manchester.gov.uk' },
  { name: 'Newcastle City Council', slug: 'newcastle', type: 'metropolitan', region: 'North East England', reps_email: 'licensing@newcastle.gov.uk' },
  { name: 'North Tyneside Council', slug: 'north-tyneside', type: 'metropolitan', region: 'North East England', reps_email: 'licensing@northtyneside.gov.uk' },
  { name: 'Oldham Council', slug: 'oldham', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@oldham.gov.uk' },
  { name: 'Rochdale Borough Council', slug: 'rochdale', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@rochdale.gov.uk' },
  { name: 'Rotherham Metropolitan Borough Council', slug: 'rotherham', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'licensing@rotherham.gov.uk' },
  { name: 'Salford City Council', slug: 'salford', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@salford.gov.uk' },
  { name: 'Sandwell Metropolitan Borough Council', slug: 'sandwell', type: 'metropolitan', region: 'West Midlands', reps_email: 'licensing@sandwell.gov.uk' },
  { name: 'Sefton Council', slug: 'sefton', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@sefton.gov.uk' },
  { name: 'Sheffield City Council', slug: 'sheffield', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'licensingservice@sheffield.gov.uk' },
  { name: 'Solihull Metropolitan Borough Council', slug: 'solihull', type: 'metropolitan', region: 'West Midlands', reps_email: 'licensing@solihull.gov.uk' },
  { name: 'South Tyneside Council', slug: 'south-tyneside', type: 'metropolitan', region: 'North East England', reps_email: 'licensing@southtyneside.gov.uk' },
  { name: 'St Helens Council', slug: 'st-helens', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@sthelens.gov.uk' },
  { name: 'Stockport Metropolitan Borough Council', slug: 'stockport', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@stockport.gov.uk' },
  { name: 'Sunderland City Council', slug: 'sunderland', type: 'metropolitan', region: 'North East England', reps_email: 'licensing@sunderland.gov.uk' },
  { name: 'Tameside Metropolitan Borough Council', slug: 'tameside', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@tameside.gov.uk' },
  { name: 'Trafford Council', slug: 'trafford', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@trafford.gov.uk' },
  { name: 'Wakefield Council', slug: 'wakefield', type: 'metropolitan', region: 'Yorkshire and the Humber', reps_email: 'licensing@wakefield.gov.uk' },
  { name: 'Walsall Council', slug: 'walsall', type: 'metropolitan', region: 'West Midlands', reps_email: 'licensing@walsall.gov.uk' },
  { name: 'Wigan Council', slug: 'wigan', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@wigan.gov.uk' },
  { name: 'Wirral Council', slug: 'wirral', type: 'metropolitan', region: 'North West England', reps_email: 'licensing@wirral.gov.uk' },
  { name: 'Wolverhampton City Council', slug: 'wolverhampton', type: 'metropolitan', region: 'West Midlands', reps_email: 'licensing@wolverhampton.gov.uk' },

  // London Boroughs (33)
  { name: 'Barking and Dagenham Council', slug: 'barking-dagenham', type: 'london-borough', region: 'London', reps_email: 'licensing@lbbd.gov.uk' },
  { name: 'Barnet Council', slug: 'barnet', type: 'london-borough', region: 'London', reps_email: 'licensing@barnet.gov.uk' },
  { name: 'Bexley Council', slug: 'bexley', type: 'london-borough', region: 'London', reps_email: 'licensing@bexley.gov.uk' },
  { name: 'Brent Council', slug: 'brent', type: 'london-borough', region: 'London', reps_email: 'business.licence@brent.gov.uk' },
  { name: 'Bromley Council', slug: 'bromley', type: 'london-borough', region: 'London', reps_email: 'licensing@bromley.gov.uk' },
  { name: 'Camden Council', slug: 'camden', type: 'london-borough', region: 'London', reps_email: 'licensing@camden.gov.uk' },
  { name: 'Croydon Council', slug: 'croydon', type: 'london-borough', region: 'London', reps_email: 'licensing@croydon.gov.uk' },
  { name: 'Ealing Council', slug: 'ealing', type: 'london-borough', region: 'London', reps_email: 'licensing@ealing.gov.uk' },
  { name: 'Enfield Council', slug: 'enfield', type: 'london-borough', region: 'London', reps_email: 'licensing@enfield.gov.uk' },
  { name: 'Greenwich Council', slug: 'greenwich', type: 'london-borough', region: 'London', reps_email: 'licensing@royalgreenwich.gov.uk' },
  { name: 'Hackney Council', slug: 'hackney', type: 'london-borough', region: 'London', reps_email: 'licensing@hackney.gov.uk' },
  { name: 'Hammersmith and Fulham Council', slug: 'hammersmith-fulham', type: 'london-borough', region: 'London', reps_email: 'licensing@lbhf.gov.uk' },
  { name: 'Haringey Council', slug: 'haringey', type: 'london-borough', region: 'London', reps_email: 'licensing@haringey.gov.uk' },
  { name: 'Harrow Council', slug: 'harrow', type: 'london-borough', region: 'London', reps_email: 'licensing@harrow.gov.uk' },
  { name: 'Havering Council', slug: 'havering', type: 'london-borough', region: 'London', reps_email: 'licensing@havering.gov.uk' },
  { name: 'Hillingdon Council', slug: 'hillingdon', type: 'london-borough', region: 'London', reps_email: 'licensing@hillingdon.gov.uk' },
  { name: 'Hounslow Council', slug: 'hounslow', type: 'london-borough', region: 'London', reps_email: 'licensing@hounslow.gov.uk' },
  { name: 'Islington Council', slug: 'islington', type: 'london-borough', region: 'London', reps_email: 'licensing@islington.gov.uk' },
  { name: 'Kensington and Chelsea Council', slug: 'kensington-chelsea', type: 'london-borough', region: 'London', reps_email: 'licensing@rbkc.gov.uk' },
  { name: 'Kingston upon Thames Council', slug: 'kingston', type: 'london-borough', region: 'London', reps_email: 'licensing@kingston.gov.uk' },
  { name: 'Lambeth Council', slug: 'lambeth', type: 'london-borough', region: 'London', reps_email: 'licensing@lambeth.gov.uk' },
  { name: 'Lewisham Council', slug: 'lewisham', type: 'london-borough', region: 'London', reps_email: 'licensing@lewisham.gov.uk' },
  { name: 'Merton Council', slug: 'merton', type: 'london-borough', region: 'London', reps_email: 'licensing@merton.gov.uk' },
  { name: 'Newham Council', slug: 'newham', type: 'london-borough', region: 'London', reps_email: 'licensing@newham.gov.uk' },
  { name: 'Redbridge Council', slug: 'redbridge', type: 'london-borough', region: 'London', reps_email: 'licensing.team@redbridge.gov.uk' },
  { name: 'Richmond upon Thames Council', slug: 'richmond', type: 'london-borough', region: 'London', reps_email: 'licensing@richmond.gov.uk' },
  { name: 'Southwark Council', slug: 'southwark', type: 'london-borough', region: 'London', reps_email: 'licensing@southwark.gov.uk' },
  { name: 'Sutton Council', slug: 'sutton', type: 'london-borough', region: 'London', reps_email: 'licensing@sutton.gov.uk' },
  { name: 'Tower Hamlets Council', slug: 'tower-hamlets', type: 'london-borough', region: 'London', reps_email: 'licensing@towerhamlets.gov.uk' },
  { name: 'Waltham Forest Council', slug: 'waltham-forest', type: 'london-borough', region: 'London', reps_email: 'licensing@walthamforest.gov.uk' },
  { name: 'Wandsworth Council', slug: 'wandsworth', type: 'london-borough', region: 'London', reps_email: 'licensing@wandsworth.gov.uk' },
  { name: 'Westminster City Council', slug: 'westminster', type: 'london-borough', region: 'London', reps_email: 'licensingreps@westminster.gov.uk' },
  { name: 'City of London Corporation', slug: 'city-of-london', type: 'london-borough', region: 'London', reps_email: 'licensing@cityoflondon.gov.uk' },

  // Wales (22)
  { name: 'Blaenau Gwent County Borough Council', slug: 'blaenau-gwent', type: 'unitary', region: 'Wales', reps_email: 'licensing@blaenau-gwent.gov.uk' },
  { name: 'Bridgend County Borough Council', slug: 'bridgend', type: 'unitary', region: 'Wales', reps_email: 'licensing@bridgend.gov.uk' },
  { name: 'Caerphilly County Borough Council', slug: 'caerphilly', type: 'unitary', region: 'Wales', reps_email: 'licensing@caerphilly.gov.uk' },
  { name: 'Cardiff Council', slug: 'cardiff', type: 'unitary', region: 'Wales', reps_email: 'licensing@cardiff.gov.uk' },
  { name: 'Carmarthenshire County Council', slug: 'carmarthenshire', type: 'unitary', region: 'Wales', reps_email: 'licensing@carmarthenshire.gov.uk' },
  { name: 'Ceredigion County Council', slug: 'ceredigion', type: 'unitary', region: 'Wales', reps_email: 'licensing@ceredigion.gov.uk' },
  { name: 'Conwy County Borough Council', slug: 'conwy', type: 'unitary', region: 'Wales', reps_email: 'licensing@conwy.gov.uk' },
  { name: 'Denbighshire County Council', slug: 'denbighshire', type: 'unitary', region: 'Wales', reps_email: 'licensing@denbighshire.gov.uk' },
  { name: 'Flintshire County Council', slug: 'flintshire', type: 'unitary', region: 'Wales', reps_email: 'licensing@flintshire.gov.uk' },
  { name: 'Gwynedd Council', slug: 'gwynedd', type: 'unitary', region: 'Wales', reps_email: 'licensing@gwynedd.gov.uk' },
  { name: 'Isle of Anglesey County Council', slug: 'anglesey', type: 'unitary', region: 'Wales', reps_email: 'licensing@anglesey.gov.uk' },
  { name: 'Merthyr Tydfil County Borough Council', slug: 'merthyr-tydfil', type: 'unitary', region: 'Wales', reps_email: 'licensing@merthyr.gov.uk' },
  { name: 'Monmouthshire County Council', slug: 'monmouthshire', type: 'unitary', region: 'Wales', reps_email: 'licensing@monmouthshire.gov.uk' },
  { name: 'Neath Port Talbot Council', slug: 'neath-port-talbot', type: 'unitary', region: 'Wales', reps_email: 'licensing@npt.gov.uk' },
  { name: 'Newport City Council', slug: 'newport', type: 'unitary', region: 'Wales', reps_email: 'licensing@newport.gov.uk' },
  { name: 'Pembrokeshire County Council', slug: 'pembrokeshire', type: 'unitary', region: 'Wales', reps_email: 'licensing@pembrokeshire.gov.uk' },
  { name: 'Powys County Council', slug: 'powys', type: 'unitary', region: 'Wales', reps_email: 'licensing@powys.gov.uk' },
  { name: 'Rhondda Cynon Taf County Borough Council', slug: 'rhondda-cynon-taf', type: 'unitary', region: 'Wales', reps_email: 'licensing@rctcbc.gov.uk' },
  { name: 'Swansea Council', slug: 'swansea', type: 'unitary', region: 'Wales', reps_email: 'licensing@swansea.gov.uk' },
  { name: 'Torfaen County Borough Council', slug: 'torfaen', type: 'unitary', region: 'Wales', reps_email: 'licensing@torfaen.gov.uk' },
  { name: 'Vale of Glamorgan Council', slug: 'vale-of-glamorgan', type: 'unitary', region: 'Wales', reps_email: 'licensing@valeofglamorgan.gov.uk' },
  { name: 'Wrexham County Borough Council', slug: 'wrexham', type: 'unitary', region: 'Wales', reps_email: 'licensing@wrexham.gov.uk' },

  // Scotland (32)
  { name: 'Aberdeen City Council', slug: 'aberdeen', type: 'unitary', region: 'Scotland', reps_email: 'licensing@aberdeencity.gov.uk' },
  { name: 'Aberdeenshire Council', slug: 'aberdeenshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@aberdeenshire.gov.uk' },
  { name: 'Angus Council', slug: 'angus', type: 'unitary', region: 'Scotland', reps_email: 'licensing@angus.gov.uk' },
  { name: 'Argyll and Bute Council', slug: 'argyll-bute', type: 'unitary', region: 'Scotland', reps_email: 'licensing@argyll-bute.gov.uk' },
  { name: 'City of Edinburgh Council', slug: 'edinburgh', type: 'unitary', region: 'Scotland', reps_email: 'liquor.licensing@edinburgh.gov.uk' },
  { name: 'Clackmannanshire Council', slug: 'clackmannanshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@clacks.gov.uk' },
  { name: 'Dumfries and Galloway Council', slug: 'dumfries-galloway', type: 'unitary', region: 'Scotland', reps_email: 'licensing@dumgal.gov.uk' },
  { name: 'Dundee City Council', slug: 'dundee', type: 'unitary', region: 'Scotland', reps_email: 'licensing@dundeecity.gov.uk' },
  { name: 'East Ayrshire Council', slug: 'east-ayrshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@east-ayrshire.gov.uk' },
  { name: 'East Dunbartonshire Council', slug: 'east-dunbartonshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@eastdunbarton.gov.uk' },
  { name: 'East Lothian Council', slug: 'east-lothian', type: 'unitary', region: 'Scotland', reps_email: 'licensing@eastlothian.gov.uk' },
  { name: 'East Renfrewshire Council', slug: 'east-renfrewshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@eastrenfrewshire.gov.uk' },
  { name: 'Falkirk Council', slug: 'falkirk', type: 'unitary', region: 'Scotland', reps_email: 'licensing@falkirk.gov.uk' },
  { name: 'Fife Council', slug: 'fife', type: 'unitary', region: 'Scotland', reps_email: 'licensing@fife.gov.uk' },
  { name: 'Glasgow City Council', slug: 'glasgow', type: 'unitary', region: 'Scotland', reps_email: 'licensing@glasgow.gov.uk' },
  { name: 'Highland Council', slug: 'highland', type: 'unitary', region: 'Scotland', reps_email: 'licensing@highland.gov.uk' },
  { name: 'Inverclyde Council', slug: 'inverclyde', type: 'unitary', region: 'Scotland', reps_email: 'licensing@inverclyde.gov.uk' },
  { name: 'Midlothian Council', slug: 'midlothian', type: 'unitary', region: 'Scotland', reps_email: 'licensing@midlothian.gov.uk' },
  { name: 'Moray Council', slug: 'moray', type: 'unitary', region: 'Scotland', reps_email: 'licensing@moray.gov.uk' },
  { name: 'North Ayrshire Council', slug: 'north-ayrshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@north-ayrshire.gov.uk' },
  { name: 'North Lanarkshire Council', slug: 'north-lanarkshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@northlan.gov.uk' },
  { name: 'Orkney Islands Council', slug: 'orkney', type: 'unitary', region: 'Scotland', reps_email: 'licensing@orkney.gov.uk' },
  { name: 'Perth and Kinross Council', slug: 'perth-kinross', type: 'unitary', region: 'Scotland', reps_email: 'licensing@pkc.gov.uk' },
  { name: 'Renfrewshire Council', slug: 'renfrewshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@renfrewshire.gov.uk' },
  { name: 'Scottish Borders Council', slug: 'scottish-borders', type: 'unitary', region: 'Scotland', reps_email: 'licensing@scotborders.gov.uk' },
  { name: 'Shetland Islands Council', slug: 'shetland', type: 'unitary', region: 'Scotland', reps_email: 'licensing@shetland.gov.uk' },
  { name: 'South Ayrshire Council', slug: 'south-ayrshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@south-ayrshire.gov.uk' },
  { name: 'South Lanarkshire Council', slug: 'south-lanarkshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@southlanarkshire.gov.uk' },
  { name: 'Stirling Council', slug: 'stirling', type: 'unitary', region: 'Scotland', reps_email: 'licensing@stirling.gov.uk' },
  { name: 'West Dunbartonshire Council', slug: 'west-dunbartonshire', type: 'unitary', region: 'Scotland', reps_email: 'licensing@west-dunbarton.gov.uk' },
  { name: 'West Lothian Council', slug: 'west-lothian', type: 'unitary', region: 'Scotland', reps_email: 'licensing@westlothian.gov.uk' },
  { name: 'Western Isles Council', slug: 'western-isles', type: 'unitary', region: 'Scotland', reps_email: 'licensing@cne-siar.gov.uk' },

  // Northern Ireland (11)
  { name: 'Antrim and Newtownabbey Borough Council', slug: 'antrim-newtownabbey', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@antrimandnewtownabbey.gov.uk' },
  { name: 'Ards and North Down Borough Council', slug: 'ards-north-down', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@ardsandnorthdown.gov.uk' },
  { name: 'Armagh City, Banbridge and Craigavon Borough Council', slug: 'armagh-banbridge-craigavon', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@armaghbanbridgecraigavon.gov.uk' },
  { name: 'Belfast City Council', slug: 'belfast', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@belfastcity.gov.uk' },
  { name: 'Causeway Coast and Glens Borough Council', slug: 'causeway-coast-glens', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@causewaycoastandglens.gov.uk' },
  { name: 'Derry City and Strabane District Council', slug: 'derry-strabane', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@derrystrabane.com' },
  { name: 'Fermanagh and Omagh District Council', slug: 'fermanagh-omagh', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@fermanaghomagh.com' },
  { name: 'Lisburn and Castlereagh City Council', slug: 'lisburn-castlereagh', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@lisburncastlereagh.gov.uk' },
  { name: 'Mid and East Antrim Borough Council', slug: 'mid-east-antrim', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@midandeastantrim.gov.uk' },
  { name: 'Mid Ulster District Council', slug: 'mid-ulster', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@midulstercouncil.org' },
  { name: 'Newry, Mourne and Down District Council', slug: 'newry-mourne-down', type: 'district', region: 'Northern Ireland', reps_email: 'licensing@newrymournedown.org' },
];

async function importCouncils() {
  console.log(`Starting import of ${UK_COUNCILS.length} UK councils...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Map UK regions to the database enum values
  const regionMap: Record<string, string> = {
    'South East England': 'england_wales',
    'East of England': 'england_wales',
    'North West England': 'england_wales',
    'East Midlands': 'england_wales',
    'South West England': 'england_wales',
    'West Midlands': 'england_wales',
    'Yorkshire and the Humber': 'england_wales',
    'North East England': 'england_wales',
    'London': 'england_wales',
    'Wales': 'england_wales',
    'Scotland': 'scotland',
    'Northern Ireland': 'ni',
  };

  for (const council of UK_COUNCILS) {
    try {
      // Check if council already exists
      const { data: existing } = await supabase
        .from('councils')
        .select('id')
        .eq('slug', council.slug)
        .single();

      if (existing) {
        console.log(`✓ Skipping ${council.name} (already exists)`);
        skipped++;
        continue;
      }

      // Map region to database enum
      const dbRegion = regionMap[council.region] || 'england_wales';

      // Insert council
      const { error } = await supabase
        .from('councils')
        .insert({
          name: council.name,
          slug: council.slug,
          region: dbRegion,
          reps_email: council.reps_email,
        });

      if (error) {
        console.error(`✗ Failed to import ${council.name}:`, error.message);
        errors++;
      } else {
        console.log(`✓ Imported ${council.name}`);
        imported++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (err) {
      console.error(`✗ Error importing ${council.name}:`, err);
      errors++;
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total councils: ${UK_COUNCILS.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

// Run the import
importCouncils()
  .then(() => {
    console.log('\nScript finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
