import type { ApiError } from '../api';

const FIELD_FA: Record<string, string> = {
  name: 'عنوان پروژه', manager: 'مدیر پروژه', unit: 'واحد متولی', start_date: 'تاریخ شروع', end_date: 'تاریخ پایان',
  goal: 'هدف پروژه', requirements: 'الزامات پروژه', constraints: 'محدودیت‌ها و مفروضات', assumptions: 'محدودیت‌ها و مفروضات', description: 'توضیحات'
};
const FIELD_EN: Record<string, string> = {
  name: 'Project Name', manager: 'Project Manager', unit: 'Owning Unit', start_date: 'Start Date', end_date: 'End Date',
  goal: 'Project Goal', requirements: 'Project Requirements', constraints: 'Constraints & Assumptions', assumptions: 'Constraints & Assumptions', description: 'Description'
};

/**
 * The words for the backend's project rules in the language of the screen. The rules themselves (and which one failed) come from the
 * backend as an error code; anything this does not know is shown with the backend's own message.
 */
export function projectErrorText(error: Pick<ApiError, 'code' | 'message'>, language: string, nameExistsText: string): string {
  const fa = language === 'fa';
  if (error.code === 'project.name_exists') return nameExistsText;

  const required = /^project\.charter\.(\w+)_required$/.exec(error.code);
  if (required) {
    const label = (fa ? FIELD_FA : FIELD_EN)[required[1]] ?? required[1];
    return fa ? `«${label}» الزامی است.` : `"${label}" is required.`;
  }

  const meaningless = /^project\.charter\.(\w+)_meaningless$/.exec(error.code);
  if (meaningless) {
    const label = (fa ? FIELD_FA : FIELD_EN)[meaningless[1]] ?? meaningless[1];
    return fa
      ? `اطلاعات ثبت شده در "${label}" معتبر نمی‌باشد. لطفاً توضیحات واقعی و مرتبط با عنوان پروژه ثبت کنید.`
      : `Invalid or meaningless text in "${label}". Please enter valid details related to the project title.`;
  }

  // The approval cycle's own refusals: the backend's Persian text is shown as is; English screens get their own wording.
  if (!fa && APPROVAL_EN[error.code]) return APPROVAL_EN[error.code];
  return error.message;
}

/** English wording of the approval-cycle error codes (the backend words them in Persian). */
const APPROVAL_EN: Record<string, string> = {
  'project.pending_approval': 'The charter is waiting for approval and cannot be edited until it is decided.',
  'project.already_pending': 'The project has already been sent for approval.',
  'project.already_approved': 'The charter is already approved. Edit it to change it.',
  'project.not_approved': 'The project is not approved yet; Active, On hold and Completed are for approved projects only.',
  'project.forbidden': 'Only the project manager or owner, or a user with project administration rights, can do this.',
  'project.calendar_not_found': 'The selected work calendar was not found.',
  'workflow.self_approval': 'You cannot approve or reject your own request.',
  'workflow.approver_missing': 'An approval step has no approver. Complete the workflow settings or the project manager and owner.',
  'workflow.concurrent_decision': 'Someone decided this step at the same time. Refresh and check again.'
};
