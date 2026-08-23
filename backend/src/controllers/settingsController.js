import db from '../config/db.js';
import { emailOutbox } from '../services/emailService.js';

/**
 * Get system configuration settings
 */
export function getSettings(req, res) {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    return res.json({
      success: true,
      data: {
        settings: settingsMap,
        raw: settings
      }
    });
  } catch (err) {
    console.error('[Get Settings Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system settings.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * Update overdue SLA threshold in days with strict boundary checks (L-06)
 */
export function updateOverdueThreshold(req, res) {
  try {
    const { days } = req.body;
    const thresholdNumber = parseInt(days, 10);

    if (isNaN(thresholdNumber) || thresholdNumber < 1 || thresholdNumber > 60) {
      return res.status(400).json({
        success: false,
        message: 'Overdue SLA threshold must be a whole number between 1 and 60 days.'
      });
    }

    db.prepare(`
      INSERT INTO settings (key, value, description)
      VALUES ('overdue_days_threshold', ?, 'Number of days after which an open complaint is considered overdue')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(thresholdNumber.toString());

    return res.json({
      success: true,
      message: `Overdue SLA threshold successfully updated to ${thresholdNumber} days.`,
      data: {
        overdue_days_threshold: thresholdNumber
      }
    });
  } catch (err) {
    console.error('[Update Settings Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update overdue threshold.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * Get recent sent emails from outbox (for demonstration and evaluation)
 */
export function getEmailOutbox(req, res) {
  return res.json({
    success: true,
    data: {
      outbox: emailOutbox,
      total_sent: emailOutbox.length
    }
  });
}
