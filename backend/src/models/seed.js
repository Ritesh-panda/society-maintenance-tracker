import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { initDatabase } from './schema.js';

export async function seedDatabase() {
  console.log('[Seed] Initializing database schema...');
  initDatabase();

  console.log('[Seed] Seeding Indian Housing Society (RWA) records...');

  db.exec(`
    DELETE FROM complaint_history;
    DELETE FROM complaints;
    DELETE FROM notices;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. RWA Committee Admin and Resident Users
  const users = [
    {
      id: 'usr_admin_1',
      name: 'Rajesh Sharma (RWA Secretary)',
      email: 'admin@society.com',
      password_hash: adminPasswordHash,
      flat_number: 'Society Estate Office, Tower A Ground Floor',
      phone: '+91 98200 11223',
      role: 'admin'
    },
    {
      id: 'usr_resident_1',
      name: 'Aarav Patel',
      email: 'aarav@society.com',
      password_hash: passwordHash,
      flat_number: 'Tower A - Flat 402',
      phone: '+91 98111 22334',
      role: 'resident'
    },
    {
      id: 'usr_resident_2',
      name: 'Priya Iyer',
      email: 'priya@society.com',
      password_hash: passwordHash,
      flat_number: 'Tower B - Flat 801',
      phone: '+91 98222 33445',
      role: 'resident'
    },
    {
      id: 'usr_resident_3',
      name: 'Vikram Malhotra',
      email: 'vikram@society.com',
      password_hash: passwordHash,
      flat_number: 'Tower C - Flat 1204',
      phone: '+91 98333 44556',
      role: 'resident'
    },
    {
      id: 'usr_resident_4',
      name: 'Sneha Kulkarni',
      email: 'sneha@society.com',
      password_hash: passwordHash,
      flat_number: 'Tower A - Flat 103',
      phone: '+91 98444 55667',
      role: 'resident'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, flat_number, phone, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  users.forEach(u => {
    insertUser.run(u.id, u.name, u.email, u.password_hash, u.flat_number, u.phone, u.role, new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
  });

  const daysAgo = (days) => new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  // 2. Realistic Indian Society Complaints
  const complaints = [
    {
      id: 'cmp_101',
      resident_id: 'usr_resident_1',
      title: 'Water tank inlet seepage in Tower A master bathroom ceiling',
      description: 'Continuous dripping from the overhead ceiling junction near exhaust fan in flat A-402. Possibility of leakage from 5th floor flat A-502 bathroom plumbing. Needs urgent plumber inspection.',
      category: 'Plumbing',
      priority: 'High',
      status: 'Open',
      photo_url: null,
      created_at: daysAgo(5), // 5 days old -> OVERDUE (threshold 3)
      updated_at: daysAgo(5),
      resolved_at: null
    },
    {
      id: 'cmp_102',
      resident_id: 'usr_resident_2',
      title: 'Tower B Passenger Lift (Otis) stopping with jerky vibration on 8th floor',
      description: 'The right-side passenger lift in Tower B makes a heavy metallic grinding noise between 7th and 8th floor and does not align flush with floor level. Senior citizens and kids facing difficulty.',
      category: 'Lift / Elevator',
      priority: 'High',
      status: 'In Progress',
      photo_url: null,
      created_at: daysAgo(4), // 4 days old -> OVERDUE (threshold 3)
      updated_at: daysAgo(1),
      resolved_at: null
    },
    {
      id: 'cmp_103',
      resident_id: 'usr_resident_3',
      title: 'Tower C 12th Floor corridor emergency LED battens flickering',
      description: 'The common corridor light outside flats 1203 and 1204 is tripping and flickering since yesterday evening DG backup test.',
      category: 'Electrical',
      priority: 'Medium',
      status: 'Open',
      photo_url: null,
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
      resolved_at: null
    },
    {
      id: 'cmp_104',
      resident_id: 'usr_resident_1',
      title: 'Clubhouse Table Tennis room sliding door track jammed',
      description: 'Aluminum sliding glass door at the ground floor clubhouse is off its bottom nylon wheel track.',
      category: 'Carpentry',
      priority: 'Low',
      status: 'Resolved',
      photo_url: null,
      created_at: daysAgo(7),
      updated_at: daysAgo(2),
      resolved_at: daysAgo(2)
    },
    {
      id: 'cmp_105',
      resident_id: 'usr_resident_4',
      title: 'Main Security Gate (Gate 1) intercom not connecting to flat A-103',
      description: 'Security guard unable to buzz flat unit for visitor delivery verification. MyGate / intercom cable line seems disconnected at the tower distribution box.',
      category: 'Security',
      priority: 'Medium',
      status: 'In Progress',
      photo_url: null,
      created_at: daysAgo(2),
      updated_at: daysAgo(1),
      resolved_at: null
    },
    {
      id: 'cmp_106',
      resident_id: 'usr_resident_3',
      title: 'Basement Parking Basement-1 near Pillar 24 rainwater drainage blocked',
      description: 'Accumulation of muddy water near parking slots B-12 and B-13 after morning garden sprinkler run. Silt drain needs de-clogging.',
      category: 'Cleanliness',
      priority: 'Medium',
      status: 'Open',
      photo_url: null,
      created_at: daysAgo(0.5),
      updated_at: daysAgo(0.5),
      resolved_at: null
    }
  ];

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, resident_id, title, description, category, priority, status, photo_url, created_at, updated_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  complaints.forEach(c => {
    insertComplaint.run(c.id, c.resident_id, c.title, c.description, c.category, c.priority, c.status, c.photo_url, c.created_at, c.updated_at, c.resolved_at);
  });

  // 3. Realistic Chronological Audit Histories
  const histories = [
    {
      id: 'hist_101_1',
      complaint_id: 'cmp_101',
      actor_id: 'usr_resident_1',
      actor_name: 'Aarav Patel',
      actor_role: 'resident',
      previous_status: null,
      new_status: 'Open',
      previous_priority: null,
      new_priority: 'High',
      note: 'Complaint submitted by resident via Society portal.',
      created_at: daysAgo(5)
    },
    {
      id: 'hist_102_1',
      complaint_id: 'cmp_102',
      actor_id: 'usr_resident_2',
      actor_name: 'Priya Iyer',
      actor_role: 'resident',
      previous_status: null,
      new_status: 'Open',
      previous_priority: null,
      new_priority: 'Medium',
      note: 'Lift noise reported after evening power cut.',
      created_at: daysAgo(4)
    },
    {
      id: 'hist_102_2',
      complaint_id: 'cmp_102',
      actor_id: 'usr_admin_1',
      actor_name: 'Rajesh Sharma (RWA Secretary)',
      actor_role: 'admin',
      previous_status: 'Open',
      new_status: 'In Progress',
      previous_priority: 'Medium',
      new_priority: 'High',
      note: 'Escalated to Otis Elevator AMC technician. Service engineer Mr. Santosh scheduled for emergency brake & rope inspection tomorrow at 10:30 AM.',
      created_at: daysAgo(1)
    },
    {
      id: 'hist_103_1',
      complaint_id: 'cmp_103',
      actor_id: 'usr_resident_3',
      actor_name: 'Vikram Malhotra',
      actor_role: 'resident',
      previous_status: null,
      new_status: 'Open',
      previous_priority: null,
      new_priority: 'Medium',
      note: 'Corridor batten flickering reported.',
      created_at: daysAgo(1)
    },
    {
      id: 'hist_104_1',
      complaint_id: 'cmp_104',
      actor_id: 'usr_resident_1',
      actor_name: 'Aarav Patel',
      actor_role: 'resident',
      previous_status: null,
      new_status: 'Open',
      previous_priority: null,
      new_priority: 'Low',
      note: 'Reported sliding door latch issue.',
      created_at: daysAgo(7)
    },
    {
      id: 'hist_104_2',
      complaint_id: 'cmp_104',
      actor_id: 'usr_admin_1',
      actor_name: 'Rajesh Sharma (RWA Secretary)',
      actor_role: 'admin',
      previous_status: 'Open',
      new_status: 'In Progress',
      previous_priority: 'Low',
      new_priority: 'Low',
      note: 'Estate facility carpenter assigned.',
      created_at: daysAgo(4)
    },
    {
      id: 'hist_104_3',
      complaint_id: 'cmp_104',
      actor_id: 'usr_admin_1',
      actor_name: 'Rajesh Sharma (RWA Secretary)',
      actor_role: 'admin',
      previous_status: 'In Progress',
      new_status: 'Resolved',
      previous_priority: 'Low',
      new_priority: 'Low',
      note: 'Nylon roller bearings replaced and aluminum track lubricated. Verified functional.',
      created_at: daysAgo(2)
    },
    {
      id: 'hist_105_1',
      complaint_id: 'cmp_105',
      actor_id: 'usr_resident_4',
      actor_name: 'Sneha Kulkarni',
      actor_role: 'resident',
      previous_status: null,
      new_status: 'Open',
      previous_priority: null,
      new_priority: 'Medium',
      note: 'Intercom connection issue reported.',
      created_at: daysAgo(2)
    },
    {
      id: 'hist_105_2',
      complaint_id: 'cmp_105',
      actor_id: 'usr_admin_1',
      actor_name: 'Rajesh Sharma (RWA Secretary)',
      actor_role: 'admin',
      previous_status: 'Open',
      new_status: 'In Progress',
      previous_priority: 'Medium',
      new_priority: 'Medium',
      note: 'Telecom technician checking main junction box at Tower A stilt floor.',
      created_at: daysAgo(1)
    },
    {
      id: 'hist_106_1',
      complaint_id: 'cmp_106',
      actor_id: 'usr_resident_3',
      actor_name: 'Vikram Malhotra',
      actor_role: 'resident',
      previous_status: null,
      new_status: 'Open',
      previous_priority: null,
      new_priority: 'Medium',
      note: 'Reported parking drainage issue.',
      created_at: daysAgo(0.5)
    }
  ];

  const insertHist = db.prepare(`
    INSERT INTO complaint_history (id, complaint_id, actor_id, actor_name, actor_role, previous_status, new_status, previous_priority, new_priority, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  histories.forEach(h => {
    insertHist.run(h.id, h.complaint_id, h.actor_id, h.actor_name, h.actor_role, h.previous_status, h.new_status, h.previous_priority, h.new_priority, h.note, h.created_at);
  });

  // 4. Authentic Indian Society Notices
  const notices = [
    {
      id: 'ntc_1',
      author_id: 'usr_admin_1',
      title: '🚨 Mandatory Overhead & Underground Water Tank Cleaning on Friday',
      content: 'Dear Residents,\n\nPlease note that semi-annual cleaning and chlorination of the Underground Sump and Overhead Water Tanks for Towers A, B, and C will be conducted this Friday by Aquaclean Services.\n\n• Timing: 9:30 AM to 2:00 PM\n• Water supply will remain shut during this duration.\n• Please store sufficient drinking and domestic water in advance.\n\nBy Order,\nManaging Committee, Gulmohar Meadows RWA',
      is_important: 1, // PINNED
      created_at: daysAgo(2)
    },
    {
      id: 'ntc_2',
      author_id: 'usr_admin_1',
      title: '📢 14th Annual General Body Meeting (AGM) & Committee Elections',
      content: 'Notice is hereby given that the 14th Annual General Body Meeting (AGM) of the Society will be held on Sunday, March 29th at 10:30 AM at the Society Clubhouse.\n\nKey Agenda:\n1. Approval of Audited Financial Statements for FY 2025-26\n2. Rooftop Solar Net-Metering Project Vendor Finalization\n3. EV Charging Infrastructure installation in Basement 1 & 2\n4. Election of new RWA Executive Members\n\nHigh Tea will follow. All flat owners are requested to attend.',
      is_important: 1, // PINNED
      created_at: daysAgo(4)
    },
    {
      id: 'ntc_3',
      author_id: 'usr_admin_1',
      title: '🎉 Grand Holi Milan & Cultural Evening Celebration',
      content: 'The Cultural Committee cordially invites all families for organic dry colors (Gulal) celebration at the central lawn from 10:00 AM onwards on festival day.\n\n• Thandai and festive snacks will be served\n• Strictly dry organic colors only (no water wastage or grease permitted)\n• DJ & Dhol performance from 11 AM to 1:30 PM.',
      is_important: 0,
      created_at: daysAgo(1)
    }
  ];

  const insertNotice = db.prepare(`
    INSERT INTO notices (id, author_id, title, content, is_important, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  notices.forEach(n => {
    insertNotice.run(n.id, n.author_id, n.title, n.content, n.is_important, n.created_at, n.created_at);
  });

  console.log('[Seed] Indian Housing Society database successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(console.error);
}
