import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { createJsonStore } from './storage.js';
import { DEFAULT_FUNNEL_DEFINITION } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de Persistência (Railway Volume)
// Se houver a variável STORAGE_DIR, usa ela. Se não, usa a pasta local do servidor.
const STORAGE_DIR = process.env.STORAGE_DIR || __dirname;

const uploadDir = path.join(STORAGE_DIR, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, nanoid() + ext);
  }
});
const upload = multer({ storage });

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const db = createJsonStore({
  filePath: path.join(STORAGE_DIR, 'data', 'db.json'),
  initialData: {
    users: [],
    funnels: [
      {
        id: 'default',
        name: 'Funil principal',
        status: 'active',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        definition: DEFAULT_FUNNEL_DEFINITION
      }
    ],
    leads: [],
    events: []
  }
});

async function ensureAdminUser() {
  await db.write(async (data) => {
    const existing = data.users.find((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (existing) return;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    data.users.push({
      id: nanoid(),
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  });
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

function adminRequired(req, res, next) {
  if (!req.auth || req.auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow resources to be loaded cross-origin (needed for file uploads display)
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased for dev: Limit each IP to 5000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true
  })
);

app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/admin/auth/login', async (req, res) => {
  const schema = z.object({ email: z.string().min(3), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });

  const { email, password } = parsed.data;
  const data = await db.read();
  const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
});

app.get('/api/admin/me', authRequired, async (req, res) => {
  const data = await db.read();
  const user = data.users.find((u) => u.id === req.auth.sub);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  res.json({ id: user.id, email: user.email, role: user.role });
});

app.get('/api/public/funnel', async (_req, res) => {
  const data = await db.read();
  const active = data.funnels.find((f) => f.status === 'active') || data.funnels[0];
  res.json({ id: active.id, version: active.version, name: active.name, definition: active.definition });
});

app.post('/api/public/events', async (req, res) => {
  const schema = z.object({
    visitorId: z.string().min(8),
    type: z.string().min(1),
    step: z.string().optional(),
    funnelId: z.string().optional(),
    payload: z.any().optional(),
    ts: z.string().datetime().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  const evt = parsed.data;
  const nowIso = new Date().toISOString();

  let leadId = null;
  await db.write(async (data) => {
    const lead = data.leads.find((l) => l.visitorId === evt.visitorId);
    if (lead) {
      leadId = lead.id;
      lead.lastSeenAt = nowIso;
      lead.updatedAt = nowIso;
    } else {
      leadId = nanoid();
      data.leads.push({
        id: leadId,
        visitorId: evt.visitorId,
        name: null,
        email: null,
        phone: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
        convertedAt: null,
        lifetimeValueCents: 0,
        tags: []
      });
    }

    if (evt.type === 'conversion' || evt.type === 'purchase') {
      const l = data.leads.find((x) => x.id === leadId);
      if (l && !l.convertedAt) l.convertedAt = nowIso;
    }

    if (evt.type === 'purchase') {
      const valueCents = Number(evt.payload?.valueCents || 0);
      const l = data.leads.find((x) => x.id === leadId);
      if (l && Number.isFinite(valueCents) && valueCents > 0) {
        l.lifetimeValueCents = Number(l.lifetimeValueCents || 0) + valueCents;
        l.updatedAt = nowIso;
      }
    }

    data.events.push({
      id: nanoid(),
      visitorId: evt.visitorId,
      leadId,
      type: evt.type,
      step: evt.step || null,
      funnelId: evt.funnelId || null,
      payload: evt.payload ?? null,
      ts: evt.ts || nowIso
    });
  });

  // Async Webhook Trigger (Fire and Forget)
  (async () => {
    try {
      const dbData = await db.read();
      const activeFunnel = dbData.funnels.find(f => f.status === 'active');
      if (!activeFunnel?.definition) return;

      const { integrations, marketing } = activeFunnel.definition;
      const lead = dbData.leads.find(l => l.visitorId === evt.visitorId);

      // 1. External Platform Webhook (e.g. for Purchase)
      if (evt.type === 'purchase' && integrations?.externalPlatform?.enabled && integrations.externalPlatform.webhookUrl) {
        fetch(integrations.externalPlatform.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'purchase', lead, payload: evt.payload })
        }).catch(err => console.error('Webhook Error (Ext):', err.message));
      }

      // 2. Email Marketing Webhook (e.g. for Lead Capture or Checkout Start)
      if (marketing?.emailMarketing?.webhookUrl) {
        const shouldFire = evt.type === 'lead_capture' || evt.type === 'checkout_started' || evt.type === 'purchase';
        if (shouldFire) {
           fetch(marketing.emailMarketing.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: evt.type, lead, payload: evt.payload })
          }).catch(err => console.error('Webhook Error (Mkt):', err.message));
        }
      }
    } catch (err) {
      console.error('Event Processing Error:', err);
    }
  })();

  res.json({ ok: true, leadId });
});

app.post('/api/public/leads/contact', async (req, res) => {
  const schema = z.object({
    visitorId: z.string().min(8),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  const { visitorId, name, email, phone } = parsed.data;
  const nowIso = new Date().toISOString();

  await db.write(async (data) => {
    const lead = data.leads.find((l) => l.visitorId === visitorId);
    if (!lead) return;
    if (typeof name === 'string') lead.name = name;
    if (typeof email === 'string') lead.email = email;
    if (typeof phone === 'string') lead.phone = phone;
    lead.updatedAt = nowIso;
  });

  res.json({ ok: true });
});

app.get('/api/admin/funnels', authRequired, adminRequired, async (_req, res) => {
  const data = await db.read();
  res.json({ funnels: data.funnels });
});

app.get('/api/admin/funnels/:id', authRequired, adminRequired, async (req, res) => {
  const { id } = req.params;
  const data = await db.read();
  const funnel = data.funnels.find((f) => f.id === id);
  if (!funnel) return res.status(404).json({ error: 'not_found' });
  res.json({ funnel });
});

app.post('/api/admin/funnels', authRequired, adminRequired, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    definition: z.any().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  const nowIso = new Date().toISOString();

  const created = await db.write(async (data) => {
    const funnel = {
      id: nanoid(),
      name: parsed.data.name,
      status: 'draft',
      version: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      definition: parsed.data.definition || structuredClone(DEFAULT_FUNNEL_DEFINITION)
    };
    data.funnels.push(funnel);
    return funnel;
  });

  res.json({ funnel: created });
});

app.put('/api/admin/funnels/:id', authRequired, adminRequired, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    status: z.enum(['draft', 'active']).optional(),
    definition: z.any().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  const { id } = req.params;
  const nowIso = new Date().toISOString();

  let updated = null;
  await db.write(async (data) => {
    const funnel = data.funnels.find((f) => f.id === id);
    if (!funnel) return;
    if (typeof parsed.data.name === 'string') funnel.name = parsed.data.name;
    if (typeof parsed.data.status === 'string') funnel.status = parsed.data.status;
    if (parsed.data.definition) {
      funnel.definition = parsed.data.definition;
      funnel.version = Number(funnel.version || 0) + 1;
    }
    funnel.updatedAt = nowIso;
    updated = funnel;
    if (parsed.data.status === 'active') {
      for (const other of data.funnels) {
        if (other.id !== funnel.id && other.status === 'active') other.status = 'draft';
      }
    }
  });

  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ funnel: updated });
});

app.delete('/api/admin/funnels/:id', authRequired, adminRequired, async (req, res) => {
  const { id } = req.params;
  let found = false;
  await db.write(async (data) => {
    const idx = data.funnels.findIndex((f) => f.id === id);
    if (idx !== -1) {
      data.funnels.splice(idx, 1);
      found = true;
    }
  });

  if (!found) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

app.get('/api/admin/leads', authRequired, adminRequired, async (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const data = await db.read();

  const rows = data.leads
    .filter((l) => {
      if (!search) return true;
      return (
        (l.email || '').toLowerCase().includes(search) ||
        (l.phone || '').toLowerCase().includes(search) ||
        (l.name || '').toLowerCase().includes(search) ||
        (l.visitorId || '').toLowerCase().includes(search)
      );
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);

  const eventsByLead = new Map();
  for (const e of data.events) {
    if (!e.leadId) continue;
    const list = eventsByLead.get(e.leadId) || [];
    list.push(e);
    eventsByLead.set(e.leadId, list);
  }

  const enriched = rows.map((l) => {
    const events = eventsByLead.get(l.id) || [];
    const last = events.reduce((acc, e) => (acc && acc.ts > e.ts ? acc : e), null);
    const lastStepView = events
      .filter((e) => e.type === 'step_view' && e.step)
      .reduce((acc, e) => (acc && acc.ts > e.ts ? acc : e), null);
    const checkoutStartedAt = events
      .filter((e) => e.type === 'checkout_started')
      .reduce((acc, e) => (acc && acc.ts > e.ts ? acc : e), null)?.ts;
    const purchases = events.filter((e) => e.type === 'purchase');
    const totalValueCents = purchases.reduce((sum, e) => sum + Number(e.payload?.valueCents || 0), 0);
    return {
      ...l,
      lastEventAt: last?.ts || null,
      lastStep: lastStepView?.step || null,
      checkoutStartedAt: checkoutStartedAt || null,
      purchasesCount: purchases.length,
      totalValueCents
    };
  });

  res.json({ leads: enriched });
});

app.get('/api/admin/leads/:id', authRequired, adminRequired, async (req, res) => {
  const { id } = req.params;
  const data = await db.read();
  const lead = data.leads.find((l) => l.id === id);
  if (!lead) return res.status(404).json({ error: 'not_found' });
  const events = data.events
    .filter((e) => e.leadId === id)
    .sort((a, b) => (a.ts > b.ts ? 1 : -1))
    .slice(-500);
  res.json({ lead, events });
});

app.get('/api/admin/metrics/overview', authRequired, adminRequired, async (_req, res) => {
  const data = await db.read();
  const totalLeads = data.leads.length;
  const totalConversions = data.leads.filter((l) => Boolean(l.convertedAt)).length;
  const conversionRate = totalLeads === 0 ? 0 : totalConversions / totalLeads;

  const byStep = new Map();
  for (const e of data.events) {
    if (e.type !== 'step_view') continue;
    if (!e.step) continue;
    byStep.set(e.step, (byStep.get(e.step) || 0) + 1);
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const purchases = data.events.filter((e) => e.type === 'purchase');
  const checkoutStarts = data.events.filter((e) => e.type === 'checkout_started');

  const toDate = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  function sumInRange(list, start) {
    let count = 0;
    let valueCents = 0;
    for (const e of list) {
      const d = toDate(e.ts);
      if (!d) continue;
      if (d >= start) {
        count += 1;
        valueCents += Number(e.payload?.valueCents || 0);
      }
    }
    return { count, valueCents };
  }

  const purchasesDay = sumInRange(purchases, startOfDay);
  const purchasesWeek = sumInRange(purchases, startOfWeek);
  const purchasesMonth = sumInRange(purchases, startOfMonth);
  const checkoutDay = sumInRange(checkoutStarts, startOfDay).count;
  const checkoutWeek = sumInRange(checkoutStarts, startOfWeek).count;
  const checkoutMonth = sumInRange(checkoutStarts, startOfMonth).count;

  const abandonmentRateDay = checkoutDay === 0 ? 0 : (checkoutDay - purchasesDay.count) / checkoutDay;
  const abandonmentRateWeek = checkoutWeek === 0 ? 0 : (checkoutWeek - purchasesWeek.count) / checkoutWeek;
  const abandonmentRateMonth = checkoutMonth === 0 ? 0 : (checkoutMonth - purchasesMonth.count) / checkoutMonth;

  const lastNDays = 30;
  const days = [];
  for (let i = lastNDays - 1; i >= 0; i -= 1) {
    const d = new Date(startOfDay);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, purchases: 0, valueCents: 0 });
  }
  const idxByDay = new Map(days.map((d, i) => [d.day, i]));
  for (const e of purchases) {
    const day = String(e.ts || '').slice(0, 10);
    const idx = idxByDay.get(day);
    if (idx === undefined) continue;
    days[idx].purchases += 1;
    days[idx].valueCents += Number(e.payload?.valueCents || 0);
  }

  const offerViews = data.events.filter((e) => e.type === 'offer_view');
  const offerAccept = data.events.filter((e) => e.type === 'offer_accept');
  const upsellTakeRate = offerViews.length === 0 ? 0 : offerAccept.length / offerViews.length;

  res.json({
    totals: { totalLeads, totalConversions, conversionRate },
    steps: Array.from(byStep.entries()).map(([step, count]) => ({ step, count })),
    sales: {
      day: purchasesDay,
      week: purchasesWeek,
      month: purchasesMonth,
      seriesLast30Days: days
    },
    checkout: {
      starts: { day: checkoutDay, week: checkoutWeek, month: checkoutMonth },
      abandonmentRate: { day: abandonmentRateDay, week: abandonmentRateWeek, month: abandonmentRateMonth }
    },
    offers: { upsellTakeRate, offerViews: offerViews.length, offerAccepts: offerAccept.length }
  });
});

app.post('/api/upload', authRequired, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  // Return full URL or relative? Relative is better for portability.
  // Assuming frontend can handle /uploads/...
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// --- User Management ---

app.get('/api/admin/users', authRequired, adminRequired, async (_req, res) => {
  const data = await db.read();
  // Return users without password hash
  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
  }));
  res.json({ users });
});

app.post('/api/admin/users', authRequired, adminRequired, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'editor', 'viewer']).default('viewer')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  const { email, password, role } = parsed.data;

  const created = await db.write(async (data) => {
    if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return null; // Email taken
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: nanoid(),
      email,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };
    data.users.push(user);
    return user;
  });

  if (!created) return res.status(400).json({ error: 'email_taken' });
  res.json({ user: { id: created.id, email: created.email, role: created.role } });
});

app.delete('/api/admin/users/:id', authRequired, adminRequired, async (req, res) => {
  const { id } = req.params;
  if (id === req.auth.sub) return res.status(400).json({ error: 'cannot_delete_self' });

  await db.write(async (data) => {
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) data.users.splice(idx, 1);
  });
  res.json({ ok: true });
});

// --- OpenPix Integration ---

app.post('/api/openpix/charge', async (req, res) => {
  // Allow public or auth? Usually public initiation for checkout, or protected if server-to-server.
  // For a checkout page, it's public but we might want to validate the cart.
  // For now, let's make it public but validate body.
  const schema = z.object({
    correlationID: z.string(),
    value: z.number().min(1), // in cents
    comment: z.string().optional(),
    customer: z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      taxID: z.string().optional() // CPF/CNPJ
    }).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  
  const appID = process.env.WOOVI_APP_ID;
  if (!appID) {
    console.warn('WOOVI_APP_ID not set');
    // Mock response for dev if no key
    return res.json({
      charge: {
        correlationID: parsed.data.correlationID,
        brCode: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Cicrano de Tal6008Brasilia62070503***6304E2CA',
        qrCodeImage: 'https://api.woovi.com/v1/qrcode/mock',
        paymentLinkUrl: 'https://woovi.com/pay/mock'
      }
    });
  }

  try {
    const response = await fetch('https://api.woovi.com/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': appID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        correlationID: parsed.data.correlationID,
        value: parsed.data.value,
        comment: parsed.data.comment,
        customer: parsed.data.customer
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error('Woovi Error:', err);
      return res.status(400).json({ error: 'payment_provider_error' });
    }

    const json = await response.json();
    res.json(json);
  } catch (e) {
    console.error('Payment Error:', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/openpix/charge/:correlationID', async (req, res) => {
  const { correlationID } = req.params;
  const appID = process.env.WOOVI_APP_ID;

  if (!appID) {
    // Mock response for dev
    return res.json({
      charge: {
        correlationID,
        status: 'ACTIVE' // Mock as always active/pending for now
      }
    });
  }

  try {
    const response = await fetch(`https://api.woovi.com/api/v1/charge/${correlationID}`, {
      method: 'GET',
      headers: {
        'Authorization': appID
      }
    });
    
    if (!response.ok) {
       return res.status(404).json({ error: 'not_found' });
    }

    const json = await response.json();
    res.json(json);
  } catch (e) {
    console.error('Payment Check Error:', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Serve static files from the React app (Production)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  const id = crypto.randomUUID();
  res.status(500).json({ error: 'internal_error', id });
});

await ensureAdminUser();
app.listen(PORT, () => {
  process.stdout.write(`API listening on http://localhost:${PORT}\n`);
});
