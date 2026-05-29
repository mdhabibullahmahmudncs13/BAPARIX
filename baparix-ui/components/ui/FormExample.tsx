/**
 * Example demonstrating React Hook Form + Zod integration with form components
 * This file serves as a reference for how to use the form components together
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CurrencyInput } from './CurrencyInput';
import { DatePicker } from './DatePicker';
import { FileUpload } from './FileUpload';
import { Button } from './Button';

// Define Zod schema for form validation
const formSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  files: z.array(z.instanceof(File)).min(1, 'At least one file is required'),
});

type FormData = z.infer<typeof formSchema>;

interface FormExampleProps {
  locale: 'bn' | 'en';
  onSubmit: (data: FormData) => void;
}

export const FormExample: React.FC<FormExampleProps> = ({ locale, onSubmit }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      date: '',
      files: [],
    },
  });

  const translations = {
    bn: {
      amount: 'পরিমাণ',
      date: 'তারিখ',
      files: 'ফাইল',
      submit: 'জমা দিন',
      amountHelper: 'বিডিটিতে পরিমাণ লিখুন',
      dateHelper: 'একটি তারিখ নির্বাচন করুন',
      filesHelper: 'সর্বোচ্চ ফাইল সাইজ: ৫এমবি',
    },
    en: {
      amount: 'Amount',
      date: 'Date',
      files: 'Files',
      submit: 'Submit',
      amountHelper: 'Enter amount in BDT',
      dateHelper: 'Select a date',
      filesHelper: 'Maximum file size: 5MB',
    },
  };

  const t = translations[locale];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* CurrencyInput with React Hook Form */}
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            label={t.amount}
            currency="BDT"
            locale={locale}
            value={field.value}
            onChange={field.onChange}
            error={errors.amount?.message}
            helperText={t.amountHelper}
            required
          />
        )}
      />

      {/* DatePicker with React Hook Form */}
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <DatePicker
            label={t.date}
            locale={locale}
            value={field.value}
            onChange={field.onChange}
            error={errors.date?.message}
            helperText={t.dateHelper}
            supportBengaliCalendar={true}
            required
          />
        )}
      />

      {/* FileUpload with React Hook Form */}
      <Controller
        name="files"
        control={control}
        render={({ field }) => (
          <FileUpload
            label={t.files}
            locale={locale}
            onFileSelect={field.onChange}
            error={errors.files?.message}
            helperText={t.filesHelper}
            multiple
            required
          />
        )}
      />

      <Button type="submit" variant="primary">
        {t.submit}
      </Button>
    </form>
  );
};
