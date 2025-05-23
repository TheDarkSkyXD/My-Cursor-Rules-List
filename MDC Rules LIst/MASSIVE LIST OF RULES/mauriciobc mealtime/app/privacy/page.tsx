import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - MealTime",
  description: "Privacy policy for MealTime app",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p>
            MealTime ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
            This privacy policy will inform you about how we handle your personal data when you use our application
            and tell you about your privacy rights.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Data We Collect</h2>
          <p>We collect and process the following data:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Authentication information (email, name)</li>
            <li>Profile information</li>
            <li>Household information</li>
            <li>Pet feeding schedules and records</li>
            <li>Usage data and preferences</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
          <p>We use your data to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide and maintain our service</li>
            <li>Notify you about feeding schedules</li>
            <li>Improve our service</li>
            <li>Communicate with you about updates</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal data against unauthorized access,
            alteration, disclosure, or destruction.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:support@mealtime-app.com" className="text-blue-600 hover:underline">
              support@mealtime-app.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
} 