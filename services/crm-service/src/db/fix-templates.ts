import dotenv from "dotenv"
import { query } from "./connection"

// Load environment variables
dotenv.config()

async function fixTemplatesTable() {
  try {
    console.log("🔧 Fixing message_templates table...")

    // Make channel nullable since we're using type instead
    console.log("Making 'channel' column nullable...")
    await query(`
      ALTER TABLE message_templates 
      ALTER COLUMN channel DROP NOT NULL
    `)

    // Insert default templates
    console.log("Inserting default templates...")

    const defaultTemplates = [
      {
        name: "welcome_email",
        type: "email",
        category: "welcome",
        subject: "Welcome to Thailand Marketplace, {{firstName}}!",
        content: `Dear {{firstName}} {{lastName}},

Welcome to Thailand Marketplace! We're excited to have you join our community.

{{#if company}}
We see you're from {{company}}. We have special offers for business clients that might interest you.
{{/if}}

Here's what you can do next:
- Browse our latest properties: {{websiteUrl}}/properties
- Set up your preferences: {{websiteUrl}}/profile
- Contact our team: {{supportEmail}}

{{#if source}}
Thank you for joining us through {{source}}.
{{/if}}

Best regards,
Thailand Marketplace Team`,
        variables: ["firstName", "lastName", "company", "websiteUrl", "supportEmail", "source"],
        conditions: { triggers: ["new_customer", "registration_complete"] },
      },
      {
        name: "follow_up_telegram",
        type: "telegram",
        category: "follow_up",
        subject: null,
        content: `Hi {{firstName}}! 👋

Thanks for your interest in our properties. Have you had a chance to review the listings we sent you?

{{#if lastViewedProperty}}
I noticed you viewed {{lastViewedProperty}}. Would you like more information about similar properties?
{{/if}}

Feel free to ask any questions! I'm here to help. 😊`,
        variables: ["firstName", "lastViewedProperty"],
        conditions: {
          triggers: ["lead_follow_up"],
          conditions: { daysSinceLastContact: { $gte: 3 } },
        },
      },
      {
        name: "appointment_reminder",
        type: "universal",
        category: "reminder",
        subject: "Appointment Reminder - {{appointmentDate}}",
        content: `Hi {{firstName}},

This is a friendly reminder about your upcoming appointment:

📅 Date: {{appointmentDate}}
🕐 Time: {{appointmentTime}}
📍 Location: {{appointmentLocation}}
👤 With: {{agentName}}

{{#if appointmentType}}
Type: {{appointmentType}}
{{/if}}

{{#if propertyAddress}}
Property: {{propertyAddress}}
{{/if}}

Please let us know if you need to reschedule.

Best regards,
{{agentName}}`,
        variables: [
          "firstName",
          "appointmentDate",
          "appointmentTime",
          "appointmentLocation",
          "agentName",
          "appointmentType",
          "propertyAddress",
        ],
        conditions: {
          triggers: ["appointment_scheduled"],
          conditions: { hoursBeforeAppointment: 24 },
        },
      },
    ]

    for (const template of defaultTemplates) {
      // Check if template already exists
      const existing = await query("SELECT id FROM message_templates WHERE name = $1", [template.name])

      if (existing.rows.length === 0) {
        await query(
          `
          INSERT INTO message_templates (name, type, category, subject, content, variables, conditions, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            template.name,
            template.type,
            template.category,
            template.subject,
            template.content,
            JSON.stringify(template.variables),
            JSON.stringify(template.conditions),
            true,
          ],
        )
        console.log(`✅ Inserted template: ${template.name}`)
      } else {
        console.log(`⏭️  Template already exists: ${template.name}`)
      }
    }

    console.log("🎉 Templates table fix completed successfully!")
  } catch (error) {
    console.error("❌ Fix failed:", error)
    process.exit(1)
  }
}

fixTemplatesTable()
