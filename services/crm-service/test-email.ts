import { EmailService } from "./src/services/EmailService"

async function testEmail() {
  console.log("🚀 Testing MailHog email sending...")
  console.log("📧 SMTP Config:")
  console.log(`   Host: ${process.env.SMTP_HOST || "localhost"}`)
  console.log(`   Port: ${process.env.SMTP_PORT || "1025"}`)
  console.log(`   From: ${process.env.SMTP_FROM || "noreply@marketplace.local"}`)
  console.log()

  const emailService = new EmailService()

  // Verify SMTP connection
  console.log("🔌 Verifying SMTP connection...")
  const isConnected = await emailService.verifyConnection()

  if (!isConnected) {
    console.error("❌ SMTP connection failed!")
    console.log("Make sure MailHog is running: docker-compose up -d mailhog")
    process.exit(1)
  }

  console.log("✅ SMTP connection verified!")
  console.log()

  // Send test email
  console.log("📨 Sending test email...")
  const result = await emailService.sendEmail({
    customerId: "test-customer-123",
    to: "test@example.com",
    subject: "Test Email from Thailand Marketplace",
    content: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #2563eb;">✉️ Test Email</h1>
          <p>This is a test email from Thailand Marketplace CRM Service.</p>
          <p>If you can see this, MailHog is working correctly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `,
    text: "This is a test email from Thailand Marketplace CRM Service.",
  })

  if (result.success) {
    console.log("✅ Email sent successfully!")
    console.log(`   Message ID: ${result.messageId}`)
    console.log(`   History ID: ${result.historyId}`)
    console.log(`   Status: ${result.status}`)
    console.log()
    console.log("🌐 Open MailHog web UI to see the email:")
    console.log("   http://localhost:8025")
  } else {
    console.error("❌ Email sending failed!")
    console.error(`   Error: ${result.error}`)
  }
}

testEmail().catch(console.error)
