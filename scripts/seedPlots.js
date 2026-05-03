import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plot from '../models/Plot.js';
import Sector from '../models/Sector.js';
import Amenity from '../models/Amenity.js';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env.local');

// ── NEW PROJECT ONLY — all other projects are NOT touched ─────────────────────
const PROJECT_ID = new mongoose.Types.ObjectId('69f1b82ee5f36ab88e6996c9');

const SECTOR_NAMES = ['RESIDENTIAL HAUTE'];

// ── Plot data extracted from layout screenshots ───────────────────────────────
// Dimensions format: "W x D" for rectangles, "W1 x W2 x D" for trapezoids,
// "W1 x W2 x D1 x D2" for irregular quads
// Area is in sq.yd as shown in the layout drawings
// ─────────────────────────────────────────────────────────────────────────────

const RESIDENTIAL_PLOTS = [
  // ── Image 1 — top block ───────────────────────────────────────────────────
  { plotNo: '001',  area: 247.40, dimensions: "46'-7½\" x 20'-8\" x 70'-10½\"" },   // trapezoid (irregular left boundary)
  { plotNo: '010',  area: 265.00, dimensions: "35' x 67'-2\""                  },   // rectangle
  { plotNo: '021',  area: 200.00, dimensions: "45' x 40'"                      },
  { plotNo: '022',  area: 153.00, dimensions: "45'-1\" x 29'-3½\" x 31'-11½\"" },   // trapezoid
  { plotNo: '023',  area: 173.18, dimensions: "45'-1\" x 33'-3½\" x 31'-11½\"" },   // trapezoid
  { plotNo: '024',  area: 200.00, dimensions: "45' x 40'"                      },
  { plotNo: '035',  area: 200.00, dimensions: "45' x 40'"                      },
  { plotNo: '036',  area: 186.66, dimensions: "45'-1\" x 38'-8\" x 31'-11½\"" },    // trapezoid

  // ── Image 9 — diagonal road block (plots 2–9) ─────────────────────────────
  { plotNo: '002',  area: 222.53, dimensions: "42'-2½\" x 57'-11½\" x 40'"    },    // trapezoid
  { plotNo: '003',  area: 295.20, dimensions: "43'-5½\" x 45' x 40'"          },    // trapezoid
  { plotNo: '004',  area: 170.94, dimensions: "43'-6\" x 47'-0½\" x 40'"      },    // trapezoid
  { plotNo: '005',  area: 247.15, dimensions: "43'-6\" x 64'-1½\" x 40'"      },    // trapezoid
  { plotNo: '006',  area: 328.15, dimensions: "44'-1\" x 81'-6\" x 40'"       },    // trapezoid
  { plotNo: '007',  area: 203.48, dimensions: "45'-0½\" x 40'-7½\""           },    // rectangle
  { plotNo: '008',  area: 200.00, dimensions: "45' x 40'"                     },
  { plotNo: '009',  area: 200.00, dimensions: "45' x 40'"                     },

  // ── Image 8 — block 11–20 ─────────────────────────────────────────────────
  { plotNo: '011',  area: 300.00, dimensions: "45' x 60'"                     },
  { plotNo: '012',  area: 200.00, dimensions: "45' x 40'"                     },
  { plotNo: '013',  area: 200.00, dimensions: "45' x 40'"                     },
  { plotNo: '014',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '015',  area: 154.00, dimensions: "45' x 30'-8\""                 },
  { plotNo: '016',  area: 154.00, dimensions: "45' x 30'-10\""                },
  { plotNo: '017',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '018',  area: 200.00, dimensions: "45' x 40'"                     },
  { plotNo: '019',  area: 200.00, dimensions: "45' x 40'"                     },
  { plotNo: '020',  area: 300.00, dimensions: "45' x 60'"                     },

  // ── Image 7 — block 25–34 ─────────────────────────────────────────────────
  { plotNo: '025',  area: 351.94, dimensions: "45' x 70'-2½\""                },
  { plotNo: '026',  area: 200.00, dimensions: "45' x 40'"                     },
  { plotNo: '027',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '028',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '029',  area: 153.00, dimensions: "45' x 30'-7\""                 },
  { plotNo: '030',  area: 103.50, dimensions: "45' x 20'-7\""                 },
  { plotNo: '031',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '032',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '033',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '034',  area: 200.00, dimensions: "45' x 40'"                     },

  // ── Image 12 — block 37–56 ────────────────────────────────────────────────
  { plotNo: '037',  area: 107.83, dimensions: "45'-1\" x 20'-2½\""            },
  { plotNo: '038',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '039',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '040',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '041',  area: 200.00, dimensions: "45'-1\" x 40'"                 },
  { plotNo: '052',  area: 200.00, dimensions: "45'-1\" x 40'"                 },
  { plotNo: '053',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '054',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '055',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '056',  area: 113.00, dimensions: "34'-7\" x 18'-6½\" x 22'-0\""  },   // trapezoid

  // ── Image 6 — block 42–51 ─────────────────────────────────────────────────
  { plotNo: '042',  area: 200.00, dimensions: "45' x 40'"                     },
  { plotNo: '043',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '044',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '045',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '046',  area: 103.50, dimensions: "45' x 20'-7\""                 },
  { plotNo: '047',  area: 103.50, dimensions: "45' x 20'-8½\""                },
  { plotNo: '048',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '049',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '050',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '051',  area: 200.00, dimensions: "45' x 40'"                     },

  // ── Image 10 — block 57–62 & 73–78 ───────────────────────────────────────
  { plotNo: '057',  area: 104.60, dimensions: "45'-1\" x 24'-6½\" x 10'-9½\"" },   // trapezoid (corner)
  { plotNo: '058',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '059',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '060',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '061',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '062',  area: 200.00, dimensions: "45'-1\" x 39'-6\""             },
  { plotNo: '073',  area: 200.00, dimensions: "45'-1\" x 39'-6\""             },
  { plotNo: '074',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '075',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '076',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '077',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '078',  area: 116.65, dimensions: "45'-1\" x 24'-6½\" x 10'-0½\"" },   // trapezoid (corner)

  // ── Image 5 — block 63–72 ─────────────────────────────────────────────────
  { plotNo: '063',  area: 200.00, dimensions: "45' x 40'"                     },
  { plotNo: '064',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '065',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '066',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '067',  area: 104.72, dimensions: "45' x 20'-10\""                },
  { plotNo: '068',  area: 105.81, dimensions: "45' x 21'-4\""                 },
  { plotNo: '069',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '070',  area: 100.00, dimensions: "45' x 20'"                     },
  { plotNo: '071',  area: 150.00, dimensions: "45' x 30'"                     },
  { plotNo: '072',  area: 200.00, dimensions: "45' x 40'"                     },

  // ── Image 11 — block 79–93 ────────────────────────────────────────────────
  { plotNo: '079',  area: 107.11, dimensions: "45'-1\" x 19'-11½\" x 10'-0½\"" },  // trapezoid (corner)
  { plotNo: '080',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '081',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '082',  area: 130.00, dimensions: "45'-1\" x 26'"                 },
  { plotNo: '083',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '084',  area: 200.00, dimensions: "45'-1\" x 40'"                 },
  { plotNo: '085',  area: 334.00, dimensions: "45' x 66'-9½\""                },
  { plotNo: '086',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '087',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '088',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '089',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '090',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '091',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '092',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '093',  area: 101.95, dimensions: "45'-1\" x 21'-10½\" x 10'-½\"" },   // trapezoid (corner)

  // ── Image 3 — block 94–117 ────────────────────────────────────────────────
  { plotNo: '094',  area: 108.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '095',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '096',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '097',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '098',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '099',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '100',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '101',  area: 100.00, dimensions: "45'-1\" x 20'"                 },
  { plotNo: '102',  area: 150.00, dimensions: "45'-1\" x 30'"                 },
  { plotNo: '103',  area: 200.00, dimensions: "45'-1\" x 40'"                 },
  { plotNo: '111',  area: 180.00, dimensions: "40'-6\" x 40'"                 },
  { plotNo: '112',  area: 134.33, dimensions: "40'-5\" x 30'"                 },
  { plotNo: '113',  area: 111.39, dimensions: "40'-2½\" x 25'"               },
  { plotNo: '114',  area: 111.39, dimensions: "40' x 25'"                    },
  { plotNo: '115',  area: 111.39, dimensions: "39'-10\" x 25'"               },
  { plotNo: '116',  area: 23.16,  dimensions: "34'-9\" x 28'-7\" x 35'"      },    // small trapezoid/triangle
  { plotNo: '117',  area: 120.00, dimensions: "43'-1\" x 45'-2\" x 20'-9\""  },    // trapezoid

  // ── Image 4 — block 104–110 ───────────────────────────────────────────────
  { plotNo: '104',  area: 215.62, dimensions: "30' x 64'-7½\" x 67'-1\""     },    // slight trapezoid
  { plotNo: '105',  area: 216.00, dimensions: "30' x 64'-9\""                },
  { plotNo: '106',  area: 216.31, dimensions: "30' x 64'-10\""               },
  { plotNo: '107',  area: 216.62, dimensions: "30' x 64'-11½\""              },
  { plotNo: '108',  area: 216.94, dimensions: "30' x 65'-0½\""               },
  { plotNo: '109',  area: 170.81, dimensions: "47'-0½\" x 32'-8½\""          },
  { plotNo: '110',  area: 170.81, dimensions: "47'-3½\" x 32'-7\""           },
].map((p, i) => ({
  ...p,
  sector:         'RESIDENTIAL HAUTE',
  projectId:      PROJECT_ID,
  facing:         ['North', 'East', 'South', 'West'][i % 4],
  corner:         false,
  pricePerSqYard: 30000,
  status:         'available',
  notes:          '',
  heldByName:     '',
  heldById:       '',
  holdUntil:      null,
}));

// ── Run seed ──────────────────────────────────────────────────────────────────
await mongoose.connect(MONGODB_URI);
console.log('✅ Connected to MongoDB');

// ⚠️  Only delete data for THIS project — all other projects are untouched
await Sector.deleteMany({ projectId: PROJECT_ID });
await Plot.deleteMany({ projectId: PROJECT_ID });
console.log('🗑️  Cleared old data for this project only');

for (const name of SECTOR_NAMES) {
  const existing = await Sector.findOne({ name, projectId: PROJECT_ID });
  if (!existing) {
    try {
      await Sector.create({ name, projectId: PROJECT_ID });
      console.log(`✅ Created sector: ${name}`);
    } catch (e) {
      if (e.code === 11000) {
        console.log(`⚠️  Sector "${name}" already exists in another project — skipping (index conflict). Plots will still seed correctly.`);
      } else {
        throw e;
      }
    }
  } else {
    console.log(`✅ Sector "${name}" already exists for this project — skipping.`);
  }
}
console.log(`✅ Sector seeding done`);

// Use upsert per plot to avoid duplicate key on plotNo+sector index
const inserted = [];
for (const plot of RESIDENTIAL_PLOTS) {
  try {
    const doc = await Plot.findOneAndUpdate(
      { plotNo: plot.plotNo, sector: plot.sector, projectId: plot.projectId },
      { $set: plot },
      { upsert: true, new: true }
    );
    inserted.push(doc);
  } catch (e) {
    if (e.code === 11000) {
      console.log(`⚠️  Plot ${plot.plotNo} duplicate — skipping`);
    } else {
      throw e;
    }
  }
}
console.log(`✅ Seeded ${inserted.length} plots`);

console.log('\n📊 Plots per sector:');
const summary = inserted.reduce((acc, p) => {
  acc[p.sector] = (acc[p.sector] || 0) + 1;
  return acc;
}, {});
Object.entries(summary).forEach(([s, c]) => console.log(`   ${s.padEnd(15)} → ${c}`));

console.log('\n📐 Size breakdown:');
const sizeSummary = inserted.reduce((acc, p) => {
  const key = `${p.area} sq.yd (${p.dimensions})`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
Object.entries(sizeSummary).sort().forEach(([size, cnt]) =>
  console.log(`   ${size} × ${cnt}`)
);

console.log(`\n   TOTAL: ${inserted.length} plots`);
await mongoose.disconnect();
console.log('✅ Done. All other projects are untouched.');