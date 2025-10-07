import Link from 'next/link';

export default function Terms() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">Terms of Use & Disclaimer</h1>
        
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">1. Service Description</h2>
            <p>
              This is a free, open-source playground tool for generating videos using OpenAI&apos;s Sora API. 
              This tool is provided &quot;as is&quot; without warranties of any kind.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">2. API Key Privacy</h2>
            <p className="mb-2">
              Your OpenAI API key is stored locally in your browser&apos;s localStorage only. We:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Do NOT store your API key on our servers</li>
              <li>Do NOT log your API key</li>
              <li>Do NOT have access to your API key</li>
              <li>Do NOT monitor your API usage</li>
            </ul>
            <p className="mt-2">
              Your API key is transmitted directly to OpenAI&apos;s servers through our backend proxy 
              and is not persisted anywhere on our infrastructure.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">3. User Responsibility</h2>
            <p className="mb-2">You are solely responsible for:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your OpenAI API key security</li>
              <li>All API usage and associated costs</li>
              <li>Compliance with OpenAI&apos;s Terms of Service</li>
              <li>Content you generate and its use</li>
              <li>Compliance with applicable laws and regulations</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">4. OpenAI Terms</h2>
            <p>
              By using this tool, you agree to comply with OpenAI&apos;s{' '}
              <a href="https://openai.com/policies/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-300 underline">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="https://openai.com/policies/usage-policies" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-300 underline">
                Usage Policies
              </a>
              . All content generation is subject to OpenAI&apos;s content moderation and acceptable use policies.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">5. No Warranties</h2>
            <p>
              This tool is provided without any warranties, express or implied. We do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Availability or uptime</li>
              <li>Accuracy of cost estimates</li>
              <li>Quality or success of video generation</li>
              <li>Compatibility with all API keys or accounts</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">6. Limitation of Liability</h2>
            <p>
              We are not liable for any damages, costs, or issues arising from:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>OpenAI API usage or charges</li>
              <li>Generated content or its use</li>
              <li>Service interruptions or errors</li>
              <li>API key exposure or misuse</li>
              <li>Content policy violations</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">7. Content Policy</h2>
            <p>
              You must comply with OpenAI&apos;s content policies. Do not generate:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Content depicting real people (including public figures)</li>
              <li>Copyrighted characters or content</li>
              <li>Inappropriate content for audiences under 18</li>
              <li>Content that violates any laws or regulations</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">8. Data Collection</h2>
            <p>
              We collect minimal data:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Standard web server logs (IP addresses, timestamps)</li>
              <li>No personal information</li>
              <li>No API keys</li>
              <li>No generated content</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">9. Third-Party Services</h2>
            <p>
              This tool uses OpenAI&apos;s API. Your use is subject to OpenAI&apos;s terms and policies. 
              We are not affiliated with, endorsed by, or sponsored by OpenAI.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">10. Changes</h2>
            <p>
              We may update these terms at any time. Continued use of the tool constitutes 
              acceptance of any changes.
            </p>
          </section>
          
          <section className="border-t border-zinc-800 pt-6 mt-8">
            <p className="text-zinc-500 text-xs">
              Last updated: October 6, 2025
            </p>
            <p className="text-zinc-600 text-xs mt-3">
              Built by{' '}
              <a 
                href="https://www.kemenystudio.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-400 underline"
              >
                Kemeny Studio
              </a>
              {' '}•{' '}
              <a 
                href="https://github.com/KemenyStudio/sora-video-generator" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-400 underline"
              >
                View on GitHub
              </a>
            </p>
          </section>
        </div>
        
        <div className="mt-8">
          <Link 
            href="/"
            className="inline-block bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold py-2 px-6 rounded-md transition-colors text-sm"
          >
            Back to App
          </Link>
        </div>
      </div>
    </main>
  );
}
