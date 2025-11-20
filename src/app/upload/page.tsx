import UploadBox from '@/components/UploadBox';

export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Receipt</h1>
        <p className="text-gray-600">Upload a receipt image to extract expense data automatically</p>
      </div>
      <UploadBox />
    </div>
  );
}
