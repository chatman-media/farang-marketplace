import logger from "@marketplace/logger"
import dotenv from "dotenv"
import { query } from "./connection"

// Load environment variables
dotenv.config()

async function updateTemplatesTable() {
  try {
    logger.info("🔄 Updating message_templates table...")

    // Add missing columns
    logger.info("Adding 'type' column...")
    await query(`
      ALTER TABLE message_templates 
      ADD COLUMN IF NOT EXISTS type VARCHAR(50)
    `)

    logger.info("Adding 'category' column...")
    await query(`
      ALTER TABLE message_templates 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100)
    `)

    logger.info("Adding 'conditions' column...")
    await query(`
      ALTER TABLE message_templates 
      ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}'
    `)

    logger.info("Adding 'created_by' column...")
    await query(`
      ALTER TABLE message_templates 
      ADD COLUMN IF NOT EXISTS created_by UUID
    `)

    // Update existing data
    logger.info("Updating existing records...")
    await query(`
      UPDATE message_templates 
      SET 
        type = COALESCE(channel, 'universal'),
        category = 'general'
      WHERE type IS NULL OR category IS NULL
    `)

    // Make type NOT NULL
    logger.info("Making 'type' column NOT NULL...")
    await query(`
      ALTER TABLE message_templates 
      ALTER COLUMN type SET NOT NULL
    `)

    // Update variables column to JSONB
    logger.info("Converting variables to JSONB...")
    await query(`
      ALTER TABLE message_templates 
      ALTER COLUMN variables TYPE JSONB USING 
      CASE 
        WHEN variables IS NULL THEN '[]'::jsonb
        ELSE array_to_json(variables)::jsonb
      END
    `)

    // Create indexes
    logger.info("Creating indexes...")
    await query(`
      CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(type)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active)
    `)

    // Insert default templates
    logger.info("Inserting default templates...")

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
        logger.info(`✅ Inserted template: ${template.name}`)
      } else {
        logger.info(`⏭️  Template already exists: ${template.name}`)
      }
    }

    logger.info("🎉 Templates table update completed successfully!")
  } catch (error) {
    logger.error("❌ Update failed:", error)
    process.exit(1)
  }
}

updateTemplatesTable()
