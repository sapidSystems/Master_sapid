import supabase from "../SupabaseClient.js";

const APP_LINK = "https://checklist-delegation-three.vercel.app/login";

/**
 * Get user email from database
 * @param {string} username - Username to fetch email for
 * @returns {Promise<string|null>} - Email address or null
 */
export const getUserEmail = async (username) => {
  try {
    console.log(`🔍 Fetching email for user: "${username}"`);
    const { data, error } = await supabase
      .from('users')
      .select('email_id')
      .eq('user_name', username)
      .limit(1);

    if (error) {
      console.error('Supabase User Email Fetch Error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️ User "${username}" not found in database.`);
      return null;
    }

    return data[0]?.email_id || null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
};

/**
 * Send a custom raw email
 */
export async function sendEmail({
  to,
  subject,
  html,
}) {
  console.info(`✉️ [emailService.sendEmail] Attempting to send custom email to:`, to);
  console.log(`✉️ [emailService.sendEmail] Subject: "${subject}"`);
  
  try {
    const { data, error } =
      await supabase.functions.invoke("send-email", {
        body: {
          to,
          subject,
          html,
        },
      });

    if (error) {
      console.error(`❌ [emailService.sendEmail] Edge Function returned network/invocation error:`, error);
      throw error;
    }

    if (data && data.error) {
      console.error(`❌ [emailService.sendEmail] Resend API returned error:`, data.error);
      return data;
    }

    console.info(`✅ [emailService.sendEmail] Email sent successfully. Response data:`, data);
    return data;
  } catch (err) {
    console.error(`❌ [emailService.sendEmail] Failed during invocation:`, err);
    throw err;
  }
}

/**
 * Send a templated email
 */
export async function sendEmailTemplate({
  to,
  template,
  params,
}) {
  console.info(`✉️ [emailService.sendEmailTemplate] Attempting to send templated email to:`, to);
  console.log(`✉️ [emailService.sendEmailTemplate] Template: "${template}" | Params:`, params);

  try {
    const { data, error } =
      await supabase.functions.invoke("send-email", {
        body: {
          to,
          template,
          params,
        },
      });

    if (error) {
      console.error(`❌ [emailService.sendEmailTemplate] Edge Function returned network/invocation error:`, error);
      throw error;
    }

    if (data && data.error) {
      console.error(`❌ [emailService.sendEmailTemplate] Resend API returned error:`, data.error);
      return data;
    }

    console.info(`✅ [emailService.sendEmailTemplate] Templated email sent successfully. Response data:`, data);
    return data;
  } catch (err) {
    console.error(`❌ [emailService.sendEmailTemplate] Failed during invocation:`, err);
    throw err;
  }
}


/**
 * Send email notification for Checklist Task Assignment
 */
export const sendChecklistTaskEmail = async (to, taskDetails) => {
  const { doerName, taskId, description, startDate, givenBy, department, duration } = taskDetails;
  return sendEmailTemplate({
    to,
    template: 'checklist_task_notification',
    params: [doerName, taskId, department || 'N/A', description, startDate, duration || 'N/A', givenBy, APP_LINK]
  });
};

/**
 * Send email notification for Delegation Task Assignment
 */
export const sendDelegationTaskEmail = async (to, taskDetails) => {
  const { doerName, taskId, description, startDate, givenBy, department } = taskDetails;
  return sendEmailTemplate({
    to,
    template: 'new_task_notification',
    params: [doerName, taskId, department || 'N/A', description, startDate, givenBy, APP_LINK]
  });
};

/**
 * Send email notification for Task Extension Approval
 */
export const sendTaskExtensionEmail = async (to, taskDetails) => {
  const { doerName, taskId, description, nextExtendDate, givenBy } = taskDetails;
  return sendEmailTemplate({
    to,
    template: 'task_extend_notification',
    params: [doerName, taskId, description, nextExtendDate, givenBy, APP_LINK]
  });
};

/**
 * Send email notification for Daily Task Summary / Reminder
 */
export const sendDailyTaskSummaryEmail = async (to, summaryDetails) => {
  const { doerName, totalTasks, pendingTasks, todayTasks } = summaryDetails;
  return sendEmailTemplate({
    to,
    template: 'daily_task_notification',
    params: [doerName, totalTasks, pendingTasks, todayTasks, APP_LINK]
  });
};

/* ==========================================
 * Workflow Notifications (Independent Service)
 * ========================================== */

/**
 * Send checklist task notification
 */
export const sendChecklistTaskNotification = async (taskDetails) => {
  try {
    const { doerName } = taskDetails;
    const email = await getUserEmail(doerName);
    if (!email) {
      console.warn(`No email found for user: ${doerName}`);
      return false;
    }
    await sendChecklistTaskEmail(email, taskDetails);
    return true;
  } catch (error) {
    console.error('Error sending checklist email:', error);
    return false;
  }
};

/**
 * Send delegation task notification
 */
export const sendDelegationTaskNotification = async (taskDetails) => {
  try {
    const { doerName } = taskDetails;
    const email = await getUserEmail(doerName);
    if (!email) {
      console.warn(`No email found for user: ${doerName}`);
      return false;
    }
    await sendDelegationTaskEmail(email, taskDetails);
    return true;
  } catch (error) {
    console.error('Error sending delegation email:', error);
    return false;
  }
};

/**
 * Send task extension notification
 */
export const sendTaskExtensionNotification = async (taskDetails) => {
  console.info('✉️ [emailService.sendTaskExtensionNotification] Invoked with task details:', JSON.stringify(taskDetails, null, 2));
  try {
    const { doerName } = taskDetails;
    const email = await getUserEmail(doerName);
    console.info(`✉️ [emailService.sendTaskExtensionNotification] Resolved email for "${doerName}": "${email}"`);
    if (!email) {
      console.warn(`⚠️ [emailService.sendTaskExtensionNotification] No email found in database for user: "${doerName}"`);
      return false;
    }
    const result = await sendTaskExtensionEmail(email, taskDetails);
    console.info('✉️ [emailService.sendTaskExtensionNotification] Email API invocation result:', JSON.stringify(result, null, 2));
    if (result && result.error) {
      console.error('❌ [emailService.sendTaskExtensionNotification] Resend API returned error:', result.error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ [emailService.sendTaskExtensionNotification] Error sending extension email:', error);
    return false;
  }
};

/**
 * Send daily task summary notification
 */
export const sendDailyTaskSummaryNotification = async (summaryDetails) => {
  try {
    const { doerName } = summaryDetails;
    const email = await getUserEmail(doerName);
    if (!email) {
      console.warn(`No email found for user: ${doerName}`);
      return false;
    }
    await sendDailyTaskSummaryEmail(email, summaryDetails);
    return true;
  } catch (error) {
    console.error('Error sending daily summary email:', error);
    return false;
  }
};

/**
 * Send task assignment notification (Delegation / Checklist / Maintenance / Repair / EA Task)
 */
export const sendTaskAssignmentNotification = async (taskDetails) => {
  const { taskType } = taskDetails;

  switch (taskType?.toLowerCase()) {
    case 'checklist':
      return sendChecklistTaskNotification(taskDetails);
    case 'maintenance':
      return sendChecklistTaskNotification(taskDetails); // Falls back to checklist template
    case 'repair':
      return sendChecklistTaskNotification(taskDetails); // Falls back to checklist template
    case 'ea':
      return sendChecklistTaskNotification(taskDetails); // Falls back to checklist template
    case 'delegation':
      return sendDelegationTaskNotification(taskDetails);
    default:
      return sendChecklistTaskNotification(taskDetails);
  }
};

export default {
  getUserEmail,
  sendEmail,
  sendEmailTemplate,
  sendChecklistTaskEmail,
  sendDelegationTaskEmail,
  sendTaskExtensionEmail,
  sendDailyTaskSummaryEmail,
  sendChecklistTaskNotification,
  sendDelegationTaskNotification,
  sendTaskExtensionNotification,
  sendDailyTaskSummaryNotification,
  sendTaskAssignmentNotification,
};