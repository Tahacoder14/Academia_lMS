import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Fee | LMS Dashboard',
  description: 'Redirecting to fee challans and billing tools within the LMS dashboard.',
};

export default function FeePage() {
  redirect('/dashboard/challans');
}
