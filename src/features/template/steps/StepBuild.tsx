import React, { useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as UI from '@/styles/ui';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import ActivityHoursMatrix from '../components/ActivityHoursMatrix';
import AddressPicker from '../components/AddressPicker';
import CouncilContactAuto from '../components/CouncilContactAuto';
import InlineHelp from '../components/InlineHelp';
import { TemplateNoticeSchema, createEmptyNotice } from '../schema';
import { useTemplateBuilder, useTemplateNotice, useTemplateStep } from '../TemplateBuilderProvider';
import type { TemplateNotice } from '../types';

function flattenErrors(errors: any, path: string[] = []): ErrorItem[] {
  if (!errors) return [];
  if (errors.message) {
    return [{ field: (path.join('-') || 'field'), message: errors.message }];
  }
  if (typeof errors !== 'object') return [];
  return Object.entries(errors).flatMap(([key, value]) => flattenErrors(value, [...path, key]));
}

export default function StepBuild() {
  const notice = useTemplateNotice();
  const { patchNotice } = useTemplateBuilder();
  const [, setStep] = useTemplateStep();

  const resolver = React.useMemo(
    () =>
      zodResolver<TemplateNotice, TemplateNotice, TemplateNotice>(TemplateNoticeSchema as any) as Resolver<TemplateNotice>,
    []
  );

  const form = useForm<TemplateNotice>({
    resolver,
    defaultValues: notice ?? createEmptyNotice(),
    mode: 'onChange',
  });

  const errors = useMemo(() => flattenErrors(form.formState.errors), [form.formState.errors]);

  React.useEffect(() => {
    form.reset(notice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice.noticeType]);

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      patchNotice(value as Partial<TemplateNotice>, true);
    });
    return () => subscription.unsubscribe();
  }, [form, patchNotice]);

  const handleSubmit = form.handleSubmit(
    (data) => {
      patchNotice(data, true);
      setStep(3);
    },
    () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  );

  const selectedType = notice.noticeType;
  const activities = form.watch('activities') ?? {};

  return (
    <section className="space-y-4" aria-label="Build notice">
      <ErrorSummary errors={errors} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={`${UI.card} p-5 md:p-6 space-y-4`}>
          <div>
            <h2 className="text-base font-semibold text-blue-900">Applicant details</h2>
            <InlineHelp id="applicant-help">Enter the legal entity responsible for the notice.</InlineHelp>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="applicantName" className="text-sm font-medium text-slate-700">
                Applicant name
              </label>
              <input
                id="applicantName"
                className={`${UI.input} mt-1 w-full`}
                {...form.register('applicantName')}
              />
              {form.formState.errors.applicantName && (
                <p className="mt-1 text-sm text-amber-700">
                  {form.formState.errors.applicantName.message as string}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="applicantAddress" className="text-sm font-medium text-slate-700">
                Applicant address
              </label>
              <textarea
                id="applicantAddress"
                className={`${UI.input} mt-1 w-full min-h-[120px]`}
                {...form.register('applicantAddress')}
              />
              {form.formState.errors.applicantAddress && (
                <p className="mt-1 text-sm text-amber-700">
                  {form.formState.errors.applicantAddress.message as string}
                </p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">
                  Contact email
                </label>
                <input id="contactEmail" className={`${UI.input} mt-1 w-full`} {...form.register('contactEmail')} />
                {form.formState.errors.contactEmail && (
                  <p className="mt-1 text-sm text-amber-700">
                    {form.formState.errors.contactEmail.message as string}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">
                  Contact phone (optional)
                </label>
                <input id="contactPhone" className={`${UI.input} mt-1 w-full`} {...form.register('contactPhone')} />
                {form.formState.errors.contactPhone && (
                  <p className="mt-1 text-sm text-amber-700">
                    {form.formState.errors.contactPhone.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={`${UI.card} p-5 md:p-6 space-y-4`}>
          <div>
            <h2 className="text-base font-semibold text-blue-900">Premises details</h2>
            <InlineHelp id="premises-help">This appears in the notice and letter to the council.</InlineHelp>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="premisesName" className="text-sm font-medium text-slate-700">
                Premises name (optional)
              </label>
              <input id="premisesName" className={`${UI.input} mt-1 w-full`} {...form.register('premisesName')} />
            </div>
            <div>
              <label htmlFor="tradingName" className="text-sm font-medium text-slate-700">
                Trading name (optional)
              </label>
              <input id="tradingName" className={`${UI.input} mt-1 w-full`} {...form.register('tradingName')} />
            </div>
          </div>
          <AddressPicker
            id="premises-address-picker"
            label="Premises address"
            value={form.watch('premisesAddress')}
            onChange={(next) => form.setValue('premisesAddress', next, { shouldValidate: true, shouldDirty: true })}
          />
          {form.formState.errors.premisesAddress && (
            <p className="mt-1 text-sm text-amber-700">
              {form.formState.errors.premisesAddress?.message as string}
            </p>
          )}
        </section>

        <section className={`${UI.card} p-5 md:p-6 space-y-4`}>
          <div>
            <h2 className="text-base font-semibold text-blue-900">Council & dates</h2>
            <InlineHelp id="council-help">
              We attempt to auto-fill your licensing authority based on the premises postcode.
            </InlineHelp>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="intendedPublicationDate" className="text-sm font-medium text-slate-700">
                Intended publication date
              </label>
              <input
                type="date"
                id="intendedPublicationDate"
                className={`${UI.input} mt-1 w-full`}
                {...form.register('intendedPublicationDate')}
              />
            </div>
            <div>
              <label htmlFor="representationDeadline" className="text-sm font-medium text-slate-700">
                Representation deadline
              </label>
              <input
                type="text"
                id="representationDeadline"
                className={`${UI.input} mt-1 w-full bg-slate-100 text-slate-600`}
                value={form.watch('representationDeadline') || ''}
                readOnly
              />
            </div>
          </div>
          <CouncilContactAuto
            postcode={form.watch('premisesAddress')?.postcode ?? ''}
            value={form.watch('council')}
            onChange={(next) => form.setValue('council', next, { shouldDirty: true })}
          />
        </section>

        <ActivityHoursMatrix
          value={activities}
          onChange={(next) => form.setValue('activities', next, { shouldDirty: true })}
        />

        {selectedType === 'new' && (
          <section className={`${UI.card} p-5 md:p-6 space-y-3`}>
            <h2 className="text-base font-semibold text-blue-900">Optional conditions summary</h2>
            <textarea
              id="conditionsSummary"
              className={`${UI.input} mt-1 w-full min-h-[120px]`}
              {...form.register('conditionsSummary')}
            />
            {form.formState.errors.conditionsSummary && (
              <p className="mt-1 text-sm text-amber-700">
                {form.formState.errors.conditionsSummary.message as string}
              </p>
            )}
          </section>
        )}

        {selectedType === 'variation' && (
          <section className={`${UI.card} p-5 md:p-6 space-y-3`}>
            <h2 className="text-base font-semibold text-blue-900">Describe the proposed changes</h2>
            <textarea
              id="variationDescription"
              className={`${UI.input} mt-1 w-full min-h-[140px]`}
              {...form.register('variationDescription')}
            />
            {form.formState.errors.variationDescription && (
              <p className="mt-1 text-sm text-amber-700">
                {form.formState.errors.variationDescription.message as string}
              </p>
            )}
            <p className="text-sm text-slate-600">
              Only complete the activities matrix above if hours or licensable activities are changing.
            </p>
          </section>
        )}

        {selectedType === 'review' && (
          <section className={`${UI.card} p-5 md:p-6 space-y-3`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="reviewApplicant" className="text-sm font-medium text-slate-700">
                  Applicant for review
                </label>
                <input
                  id="reviewApplicant"
                  className={`${UI.input} mt-1 w-full`}
                  placeholder="Defaults to the applicant above"
                  {...form.register('reviewApplicant')}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="reviewGrounds" className="text-sm font-medium text-slate-700">
                  Grounds for review
                </label>
                <textarea
                  id="reviewGrounds"
                  className={`${UI.input} mt-1 w-full min-h-[140px]`}
                  {...form.register('reviewGrounds')}
                />
                {form.formState.errors.reviewGrounds && (
                  <p className="mt-1 text-sm text-amber-700">
                    {form.formState.errors.reviewGrounds.message as string}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            className={`${UI.btnSecondary} h-11 px-6 text-sm`}
            onClick={() => setStep(1)}
          >
            Back
          </button>
          <div className="flex items-center gap-3">
            <button type="button" className={`${UI.btnSecondary} h-11 px-6 text-sm`} onClick={() => form.reset(notice)}>
              Reset
            </button>
            <button type="submit" className={`${UI.btnPrimary} h-11 px-6 text-sm`}>
              Continue
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
