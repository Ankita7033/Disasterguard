const nodemailer = require('nodemailer')
require('dotenv').config()

function getTwilioClient() {
  const sid = process.env.TWILIO_SID
  const token = process.env.TWILIO_TOKEN
  if (!sid || !token || sid === 'your-twilio-account-sid') return null
  try {
    return require('twilio')(sid, token)
  } catch {
    return null
  }
}

function getMailTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass || pass === 'your-16-char-app-password') return null
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass }
  })
}

function severityColor(severity) {
  if (severity === 'HIGH')   return '#EF4444'
  if (severity === 'MEDIUM') return '#F97316'
  return '#22C55E'
}

function buildEmailHtml(data) {
  const { city, region, event_type, severity, risk_score, shelter_name, shelter_distance_km, shelter_phone } = data
  const color = severityColor(severity)
  const riskPct = Math.round((risk_score || 0) * 100)
  const eventLabel = (event_type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>DisasterGuard Alert</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:${color};padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">DisasterGuard Alert</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${timestamp} (IST)</p>
    </div>
    <div style="padding:32px;">
      <div style="display:inline-block;background:${color};color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:bold;margin-bottom:20px;">
        ${severity} RISK
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#666;width:140px;">City</td><td style="padding:8px 0;font-weight:600;">${city}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Region</td><td style="padding:8px 0;font-weight:600;">${region}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Event Type</td><td style="padding:8px 0;font-weight:600;">${eventLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Risk Score</td><td style="padding:8px 0;font-weight:600;color:${color};">${riskPct}%</td></tr>
        ${shelter_name ? `
        <tr><td colspan="2" style="padding:16px 0 8px;border-top:1px solid #eee;font-weight:700;color:#333;">Nearest Shelter Assigned</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Name</td><td style="padding:8px 0;font-weight:600;">${shelter_name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Distance</td><td style="padding:8px 0;font-weight:600;">${shelter_distance_km} km</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Contact</td><td style="padding:8px 0;font-weight:600;">${shelter_phone || 'N/A'}</td></tr>
        ` : ''}
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#999;">This is an automated alert from DisasterGuard — AI-Powered Disaster Monitoring System.</p>
    </div>
  </div>
</body>
</html>`
}

async function sendAlert(alertData) {
  const { city, region, severity, event_type, risk_score, shelter_name, shelter_phone } = alertData
  const riskPct = Math.round((risk_score || 0) * 100)
  const eventLabel = (event_type || '').replace(/_/g, ' ')

  if (severity === 'HIGH') {
    const twilio = getTwilioClient()
    if (twilio && process.env.ALERT_PHONE_NUMBER) {
      try {
        await twilio.messages.create({
          body: `[DisasterGuard] HIGH ALERT in ${city}, ${region}: ${eventLabel}. Risk: ${riskPct}%. Shelter: ${shelter_name || 'Locating...'}${shelter_phone ? ` (${shelter_phone})` : ''}. Stay safe.`,
          to: process.env.ALERT_PHONE_NUMBER,
          from: process.env.TWILIO_PHONE
        })
        console.log(`[Notifier] SMS sent for ${city} HIGH alert`)
      } catch (err) {
        console.error(`[Notifier] SMS failed for ${city}:`, err.message)
      }
    }
  }

  if (severity === 'HIGH' || severity === 'MEDIUM') {
    const transporter = getMailTransporter()
    if (transporter && process.env.GMAIL_USER) {
      try {
        await transporter.sendMail({
          from: `"DisasterGuard" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_USER,
          subject: `[${severity}] DisasterGuard Alert — ${city}, ${region}`,
          html: buildEmailHtml(alertData)
        })
        console.log(`[Notifier] Email sent for ${city} ${severity} alert`)
      } catch (err) {
        console.error(`[Notifier] Email failed for ${city}:`, err.message)
      }
    }
  }
}

module.exports = { sendAlert }
