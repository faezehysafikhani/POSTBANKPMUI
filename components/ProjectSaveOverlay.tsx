import React, { useLayoutEffect, useRef } from 'react';

export function ProjectSaveOverlay({ isPersian }: { isPersian: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="project-save-overlay"
      dir={isPersian ? 'rtl' : 'ltr'}
      aria-label={isPersian ? 'در حال ثبت پروژه' : 'Saving project'}
      onCancel={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div role="status" className="project-save-status">
        <span className="project-save-spinner" aria-hidden="true" />
        <strong>{isPersian ? 'در حال ثبت پروژه…' : 'Saving project…'}</strong>
        <span>{isPersian ? 'لطفاً چند لحظه صبر کنید.' : 'Please wait a moment.'}</span>
      </div>
    </dialog>
  );
}
