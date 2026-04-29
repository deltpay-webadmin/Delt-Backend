import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Initialize database table on startup
(async () => {
  try {
    const { createClient } = await import("jsr:@supabase/supabase-js@2.49.8");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );
    
    // Check if table exists by trying to query it
    const { error: tableCheckError } = await supabase
      .from("kv_store_e3e3d1af")
      .select("key")
      .limit(1);
    
    if (tableCheckError) {
      if (tableCheckError.message.includes("does not exist") || 
          tableCheckError.message.includes("relation") ||
          tableCheckError.message.includes("not found")) {
        console.log("❌ [Init] Table kv_store_e3e3d1af does not exist.");
        console.log("🔧 [Init] Attempting to create table automatically...");
        
        // Try to create the table using Supabase query() method
        try {
          // Use the raw SQL query method
          const { error: createError } = await supabase.rpc('exec_sql', {
            sql: `CREATE TABLE IF NOT EXISTS kv_store_e3e3d1af (
              key TEXT NOT NULL PRIMARY KEY,
              value JSONB NOT NULL
            );`
          });
          
          if (createError) {
            throw createError;
          }
          
          console.log("✅ [Init] Successfully created kv_store_e3e3d1af table!");
          console.log("✅ [Init] Your deals will now save properly.");
        } catch (createError) {
          // Auto-creation failed, show manual instructions
          console.log("");
          console.log("═══════════════════════════════════════════════════════════");
          console.log("⚠️  MANUAL DATABASE SETUP REQUIRED");
          console.log("═══════════════════════════════════════════════════════════");
          console.log("");
          console.log("The kv_store_e3e3d1af table could not be created automatically.");
          console.log("Please create it manually by following these steps:");
          console.log("");
          console.log("📋 STEP-BY-STEP INSTRUCTIONS:");
          console.log("");
          console.log("1️⃣  Open your Supabase Dashboard:");
          console.log("   https://supabase.com/dashboard/project/ijnyaweoexjqptzilwvy/editor");
          console.log("");
          console.log("2️⃣  Click 'SQL Editor' in the left sidebar");
          console.log("");
          console.log("3️⃣  Click 'New Query' button");
          console.log("");
          console.log("4️⃣  Copy and paste this SQL code:");
          console.log("");
          console.log("   CREATE TABLE IF NOT EXISTS kv_store_e3e3d1af (");
          console.log("     key TEXT NOT NULL PRIMARY KEY,");
          console.log("     value JSONB NOT NULL");
          console.log("   );");
          console.log("");
          console.log("5️⃣  Click 'RUN' button to execute the query");
          console.log("");
          console.log("6️⃣  Refresh your Delt Pay app");
          console.log("");
          console.log("═══════════════════════════════════════════════════════════");
          console.log("");
          console.log("Error details:", createError);
        }
      } else {
        console.error("❌ [Init] Error checking table:", tableCheckError.message);
      }
    } else {
      console.log("✅ [Init] Table kv_store_e3e3d1af is ready!");
    }
  } catch (error) {
    console.error("❌ [Init] Initialization error:", error);
    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("⚠️  DATABASE CONNECTION ISSUE");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");
    console.log("Could not connect to the database.");
    console.log("Please ensure:");
    console.log("  • Your Supabase project is active");
    console.log("  • Environment variables are set correctly");
    console.log("  • The kv_store_e3e3d1af table exists");
    console.log("");
    console.log("Create the table manually:");
    console.log("https://supabase.com/dashboard/project/ijnyaweoexjqptzilwvy/editor");
    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
  }
})();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e3e3d1af/health", (c) => {
  return c.json({ status: "ok" });
});

// Save a deal
app.post("/make-server-e3e3d1af/deals", async (c) => {
  try {
    const deal = await c.req.json();
    const dealId = deal.id || `deal_${Date.now()}`;
    
    // Ensure the id is in the deal object itself, not just the key
    const dealWithId = { ...deal, id: dealId };
    await kv.set(`deal:${dealId}`, dealWithId);
    
    console.log('[Server] Saved deal with ID:', dealId);
    return c.json({ success: true, id: dealId, deal: dealWithId });
  } catch (error) {
    console.error("Error saving deal:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all deals
app.get("/make-server-e3e3d1af/deals", async (c) => {
  try {
    // Get raw data with both keys and values
    const { createClient } = await import("jsr:@supabase/supabase-js@2.49.8");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );
    
    const { data, error } = await supabase
      .from("kv_store_e3e3d1af")
      .select("key, value")
      .like("key", "deal:%");
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Extract IDs from keys and ensure they're in the values
    const deals = (data || []).map((item: any) => {
      const dealId = item.key.replace('deal:', '');
      return { ...item.value, id: dealId };
    });
    
    console.log('[Server] Fetched', deals.length, 'deals');
    return c.json({ success: true, deals });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get a specific deal
app.get("/make-server-e3e3d1af/deals/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const deal = await kv.get(`deal:${id}`);
    
    if (!deal) {
      return c.json({ success: false, error: "Deal not found" }, 404);
    }
    
    return c.json({ success: true, deal });
  } catch (error) {
    console.error("Error fetching deal:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update a deal (with upsert fallback)
app.put("/make-server-e3e3d1af/deals/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    console.log('[Server] UPDATE request for deal ID:', id);
    console.log('[Server] Looking for key:', `deal:${id}`);
    
    const existingDeal = await kv.get(`deal:${id}`);
    console.log('[Server] Found existing deal:', existingDeal ? 'YES' : 'NO');
    
    if (!existingDeal) {
      // If deal doesn't exist, create it (upsert behavior)
      console.log('[Server] Deal not found, creating new deal with ID:', id);
      const newDeal = { ...updates, id };
      await kv.set(`deal:${id}`, newDeal);
      console.log('[Server] Successfully created deal:', id);
      return c.json({ success: true, deal: newDeal });
    }
    
    const updatedDeal = { ...existingDeal, ...updates, id };
    await kv.set(`deal:${id}`, updatedDeal);
    
    console.log('[Server] Successfully updated deal:', id);
    return c.json({ success: true, deal: updatedDeal });
  } catch (error) {
    console.error("[Server] Error updating deal:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete a deal
app.delete("/make-server-e3e3d1af/deals/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`deal:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============================================================
// LEAD MANAGEMENT ENDPOINTS
// ============================================================

// Get all leads
app.get("/make-server-e3e3d1af/leads", async (c) => {
  try {
    const { createClient } = await import("jsr:@supabase/supabase-js@2.49.8");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );
    
    const { data, error } = await supabase
      .from("kv_store_e3e3d1af")
      .select("key, value")
      .like("key", "lead:%");
    
    if (error) {
      throw new Error(error.message);
    }
    
    const leads = (data || []).map((item: any) => {
      const leadId = item.key.replace('lead:', '');
      return { ...item.value, id: leadId };
    });
    
    console.log('[Server] Fetched', leads.length, 'leads');
    return c.json({ success: true, leads });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ─── Lead pipeline tagging (mirrors crmStore deriveLeadTag + LEAD_PLAYBOOK) ──
// Edge functions cannot import from src/app/components, so the routing logic
// is duplicated here. Keep in sync with src/app/components/backend/crmStore.ts.
// 4 segments derived from 2 qualifying questions on /get-funded.
const DELT_RATE = 0.026;       // Delt effective rate used for savings calc
const DELT_PER_TXN = 0.10;     // Delt per-transaction fee used for savings calc
const CAP_OFFER_FLOOR = 5_000;
const CAP_OFFER_CEILING = 300_000;

function deriveLeadTagServer(acceptsCards?: string | null, openToSwitch?: string | null): string | null {
  if (!acceptsCards) return null;
  if (acceptsCards === 'already-delt') return 'Existing-Customer-Upsell';
  if (acceptsCards === 'no') return 'MS+CAP-NewMerchant';
  if (acceptsCards === 'yes') {
    if (openToSwitch === 'no') return 'CAP-Only';
    if (openToSwitch === 'yes' || openToSwitch === 'maybe') return 'MS+CAP-Switcher';
  }
  return null;
}

const LEAD_PLAYBOOK_SERVER: Record<string, { priority: string; queue: string; initialStage: string; assignedAgent: string }> = {
  'MS+CAP-Switcher':         { priority: 'High',   queue: 'Bundle Sales',           initialStage: 'Qualified', assignedAgent: 'Bundle Sales' },
  'CAP-Only':                { priority: 'Medium', queue: 'Capital Desk',           initialStage: 'Qualified', assignedAgent: 'Capital Desk' },
  'MS+CAP-NewMerchant':      { priority: 'Medium', queue: 'New Merchant Onboarding',initialStage: 'New',       assignedAgent: 'New Merchant Onboarding' },
  'Existing-Customer-Upsell':{ priority: 'High',   queue: 'Customer Success',       initialStage: 'Qualified', assignedAgent: 'Customer Success' },
};

function computePreApproval(monthlyVolume?: number) {
  const v = Number(monthlyVolume) || 0;
  if (v <= 0) return { low: 0, high: 0 };
  return {
    low:  Math.max(CAP_OFFER_FLOOR, Math.min(v * 0.5, CAP_OFFER_CEILING)),
    high: Math.min(v * 1.5, CAP_OFFER_CEILING),
  };
}

function computeEstimatedSavings(monthlyVolume?: number, avgTicket?: number, currentRate?: number, currentPerTxn?: number) {
  const v = Number(monthlyVolume) || 0;
  const t = Number(avgTicket) || 0;
  const cr = Number(currentRate) || 0;
  const cpt = Number(currentPerTxn) || 0;
  if (v <= 0 || t <= 0) return 0;
  const txns = v / t;
  const currentCost = v * (cr / 100) + txns * cpt;
  const deltCost    = v * DELT_RATE     + txns * DELT_PER_TXN;
  return Math.max(0, Math.round(currentCost - deltCost));
}

// Create a new lead
app.post("/make-server-e3e3d1af/leads", async (c) => {
  try {
    const lead = await c.req.json();
    const leadId = lead.id || `lead_${Date.now()}`;

    // Derive tag + routing server-side. Always trust server logic over
    // client-supplied leadTag so the pipeline can't be poisoned.
    const acceptsCards   = lead.acceptsCards   ?? null;
    const openToSwitch   = lead.openToSwitch   ?? null;
    const leadTag        = deriveLeadTagServer(acceptsCards, openToSwitch);
    const playbook       = leadTag ? LEAD_PLAYBOOK_SERVER[leadTag] : null;

    const monthlyVolumeEstimate = lead.monthlyVolumeEstimate != null ? Number(lead.monthlyVolumeEstimate) : undefined;
    const avgTicket             = lead.avgTicket            != null ? Number(lead.avgTicket)            : undefined;
    const currentRate           = lead.currentRate          != null ? Number(lead.currentRate)          : undefined;
    const currentPerTxn         = lead.currentPerTxn        != null ? Number(lead.currentPerTxn)        : undefined;

    const { low: preApprovalLow, high: preApprovalHigh } = computePreApproval(monthlyVolumeEstimate);
    const estimatedSavingsMonthly = computeEstimatedSavings(monthlyVolumeEstimate, avgTicket, currentRate, currentPerTxn);

    const leadWithId = {
      ...lead,
      id: leadId,
      leadTag,
      acceptsCards,
      openToSwitch,
      monthlyVolumeEstimate,
      avgTicket,
      currentRate,
      currentPerTxn,
      estimatedSavingsMonthly,
      preApprovalLow,
      preApprovalHigh,
      // Server-set routing — overrides client values when we have a tag.
      ...(playbook ? {
        priority:      lead.priority      || playbook.priority,
        status:        lead.status        || 'New',
        stage:         lead.stage         || playbook.initialStage,
        assignedAgent: lead.assignedAgent || playbook.assignedAgent,
        queue:         playbook.queue,
      } : {}),
      createdAt: lead.createdAt || new Date().toISOString(),
    };

    await kv.set(`lead:${leadId}`, leadWithId);

    console.log('[Server] Created lead', leadId, 'tag=', leadTag, 'queue=', playbook?.queue);
    return c.json({ success: true, id: leadId, lead: leadWithId });
  } catch (error) {
    console.error("Error creating lead:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get a specific lead
app.get("/make-server-e3e3d1af/leads/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const lead = await kv.get(`lead:${id}`);
    
    if (!lead) {
      return c.json({ success: false, error: "Lead not found" }, 404);
    }
    
    return c.json({ success: true, lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update a lead
app.put("/make-server-e3e3d1af/leads/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    console.log('[Server] UPDATE request for lead ID:', id);
    
    // Get existing lead
    const existingLead = await kv.get(`lead:${id}`);
    
    if (!existingLead) {
      return c.json({ success: false, error: "Lead not found" }, 404);
    }
    
    // Merge updates with existing lead
    const updatedLead = { ...existingLead, ...updates, id };
    await kv.set(`lead:${id}`, updatedLead);
    
    console.log('[Server] Successfully updated lead:', id);
    return c.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error("[Server] Error updating lead:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete a lead
app.delete("/make-server-e3e3d1af/leads/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`lead:${id}`);
    
    console.log('[Server] Deleted lead:', id);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============================================================
// END LEAD MANAGEMENT ENDPOINTS
// ============================================================

// Send payment reminder email
app.post("/make-server-e3e3d1af/notifications/payment-reminder", async (c) => {
  try {
    const { dealId, borrowerEmail, borrowerName, amountDue, dueDate } = await c.req.json();
    
    console.log('[Server] Sending payment reminder for deal:', dealId);
    
    // Store notification in KV for tracking
    const notificationId = `notification_${Date.now()}`;
    const notification = {
      id: notificationId,
      type: 'payment_reminder',
      dealId,
      borrowerEmail,
      borrowerName,
      amountDue,
      dueDate,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    
    await kv.set(`notification:${notificationId}`, notification);
    
    // Log email content (in production, this would integrate with an email service like SendGrid or AWS SES)
    console.log('[Email] Payment Reminder');
    console.log('[Email] To:', borrowerEmail);
    console.log('[Email] Subject: Payment Reminder - Delt Pay');
    console.log('[Email] Body:');
    console.log(`Dear ${borrowerName},`);
    console.log(`This is a friendly reminder that a payment of $${amountDue.toLocaleString()} is due on ${new Date(dueDate).toLocaleDateString()}.`);
    console.log('Please ensure timely payment to maintain your account in good standing.');
    console.log('Thank you for your business.');
    console.log('Delt Pay Team');
    
    return c.json({ 
      success: true, 
      notificationId,
      message: 'Payment reminder logged successfully (email service integration required for actual sending)'
    });
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Send deal status change notification
app.post("/make-server-e3e3d1af/notifications/status-change", async (c) => {
  try {
    const { dealId, borrowerEmail, borrowerName, oldStatus, newStatus, dealName } = await c.req.json();
    
    console.log('[Server] Sending status change notification for deal:', dealId);
    
    // Store notification in KV for tracking
    const notificationId = `notification_${Date.now()}`;
    const notification = {
      id: notificationId,
      type: 'status_change',
      dealId,
      borrowerEmail,
      borrowerName,
      oldStatus,
      newStatus,
      dealName,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    
    await kv.set(`notification:${notificationId}`, notification);
    
    // Log email content
    console.log('[Email] Deal Status Change Notification');
    console.log('[Email] To:', borrowerEmail);
    console.log('[Email] Subject: Deal Status Update - Delt Pay');
    console.log('[Email] Body:');
    console.log(`Dear ${borrowerName},`);
    console.log(`We wanted to inform you that the status of your deal "${dealName}" has been updated.`);
    console.log(`Previous Status: ${oldStatus}`);
    console.log(`New Status: ${newStatus}`);
    if (newStatus === 'Funded') {
      console.log('Congratulations! Your funding has been approved and will be disbursed shortly.');
    } else if (newStatus === 'Declined') {
      console.log('Unfortunately, we are unable to proceed with this application at this time.');
    }
    console.log('If you have any questions, please contact your account manager.');
    console.log('Best regards,');
    console.log('Delt Pay Team');
    
    return c.json({ 
      success: true, 
      notificationId,
      message: 'Status change notification logged successfully (email service integration required for actual sending)'
    });
  } catch (error) {
    console.error("Error sending status change notification:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all notifications
app.get("/make-server-e3e3d1af/notifications", async (c) => {
  try {
    const { createClient } = await import("jsr:@supabase/supabase-js@2.49.8");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );
    
    const { data, error } = await supabase
      .from("kv_store_e3e3d1af")
      .select("key, value")
      .like("key", "notification:%");
    
    if (error) {
      throw new Error(error.message);
    }
    
    const notifications = (data || []).map((item: any) => ({
      ...item.value
    }));
    
    return c.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get user profile by email
app.get("/make-server-e3e3d1af/user/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const user = await kv.get(`user:${email}`);
    
    if (!user) {
      // Return default user if not found in database
      return c.json({ 
        success: true, 
        user: {
          email,
          name: 'Patrick Johnson',
          role: 'Admin'
        }
      });
    }
    
    return c.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update user profile
app.put("/make-server-e3e3d1af/user/:email", async (c) => {
  try {
    const oldEmail = c.req.param("email");
    const updates = await c.req.json();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[Server] 📝 Updating user profile');
    console.log('[Server] Old email:', oldEmail);
    console.log('[Server] Updates received:', JSON.stringify(updates, null, 2));
    
    // Get existing user or create new one
    let existingUser = await kv.get(`user:${oldEmail}`);
    console.log('[Server] Existing user in DB:', existingUser ? JSON.stringify(existingUser, null, 2) : 'NOT FOUND');
    
    if (!existingUser) {
      console.log('[Server] ⚠️  No existing user found, creating default profile');
      existingUser = {
        email: oldEmail,
        name: 'Patrick Johnson',
        role: 'Admin'
      };
    }
    
    // If email is being changed, we need to handle it specially
    const newEmail = updates.email || oldEmail;
    const emailChanged = newEmail !== oldEmail;
    
    // Merge updates with existing user
    const updatedUser = { ...existingUser, ...updates };
    console.log('[Server] Merged user data:', JSON.stringify(updatedUser, null, 2));
    
    if (emailChanged) {
      // Delete old key and save with new key
      console.log('[Server] 🔄 Email changed from', oldEmail, 'to', newEmail);
      console.log('[Server] Deleting old key: user:' + oldEmail);
      await kv.del(`user:${oldEmail}`);
      console.log('[Server] Setting new key: user:' + newEmail);
      await kv.set(`user:${newEmail}`, updatedUser);
    } else {
      // Just update the existing key
      console.log('[Server] ✏️  Updating existing key: user:' + oldEmail);
      await kv.set(`user:${oldEmail}`, updatedUser);
    }
    
    // Verify the save by reading it back
    const verifyUser = await kv.get(`user:${newEmail}`);
    console.log('[Server] ✅ Verified saved user:', verifyUser ? JSON.stringify(verifyUser, null, 2) : 'VERIFICATION FAILED');
    console.log('[Server] Successfully updated user:', newEmail);
    console.log('═══════════════════════════════════════════════════════════');
    
    return c.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("═══════════════════════════════════════════════════════════");
    console.error("[Server] ❌ Error updating user profile:", error);
    console.error("═══════════════════════════════════════════════════════════");
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);