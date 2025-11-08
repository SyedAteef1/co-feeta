import { CheckIcon } from '../ui/Icons'

const HowItWorksSection = () => {
  return (
    <section className="py-20 px-6 bg-gray-50" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How Feeta Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Three simple steps to transform your ideas into executed projects
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Describe Your Vision</h3>
              <p className="text-gray-600 mb-6">
                Simply tell Feeta what you want to accomplish in natural language. No complex forms or technical jargon needed.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-sm italic text-gray-700 border-l-4 border-blue-400">
                "I need to launch a SaaS product by Q2 with focus on user onboarding and payment integration."
              </div>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Creates The Plan</h3>
              <p className="text-gray-600 mb-6">
                Our AI analyzes your requirements and automatically generates a detailed project plan with timelines and dependencies.
              </p>
              <div className="space-y-2">
                <div className="bg-blue-50 p-3 rounded-lg text-sm font-medium">UI/UX Design & Prototyping</div>
                <div className="bg-emerald-50 p-3 rounded-lg text-sm font-medium">Backend Development</div>
                <div className="bg-orange-50 p-3 rounded-lg text-sm font-medium">Payment Integration</div>
              </div>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Execute with Your Team</h3>
              <p className="text-gray-600 mb-6">
                Delegate tasks to your team and track progress in real-time across all your integrated tools.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Sarah (Design)</span>
                  <CheckIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Mike (Frontend)</span>
                  <div className="w-5 h-5 bg-orange-400 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Alex (Backend)</span>
                  <div className="w-5 h-5 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
