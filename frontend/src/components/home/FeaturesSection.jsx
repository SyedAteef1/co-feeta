import { BrainIcon, TaskIcon, UserIcon, CheckIcon } from '../ui/Icons'

const FeaturesSection = () => {
  return (
    <section className="py-20 px-6 bg-white" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features for Modern Teams</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Feeta combines cutting-edge AI with practical project management tools to deliver unprecedented efficiency and control.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <BrainIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Natural Language Processing</h3>
            <p className="text-gray-600 mb-6">
              Describe projects in plain English. Our advanced NLP understands context, requirements, and constraints to create action-oriented plans.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-emerald-600">
                <CheckIcon className="w-4 h-4 mr-3" />
                Context-aware project interpretation
              </div>
              <div className="flex items-center text-sm text-emerald-600">
                <CheckIcon className="w-4 h-4 mr-3" />
                Multi-language support
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
              <TaskIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Intelligent Task Breakdown</h3>
            <p className="text-gray-600 mb-6">
              Automatically decompose complex projects into manageable tasks, mapping dependencies and optimizing resources.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-emerald-600">
                <CheckIcon className="w-4 h-4 mr-3" />
                Automated workflow structure
              </div>
              <div className="flex items-center text-sm text-emerald-600">
                <CheckIcon className="w-4 h-4 mr-3" />
                Resource optimization
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <UserIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Human-in-the-Loop Control</h3>
            <p className="text-gray-600 mb-6">
              Maintain full control with approval workflows. Every AI suggestion requires your decision with complete audit trails.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-emerald-600">
                <CheckIcon className="w-4 h-4 mr-3" />
                Explicit task approval
              </div>
              <div className="flex items-center text-sm text-emerald-600">
                <CheckIcon className="w-4 h-4 mr-3" />
                Customizable workflows
              </div>
              <div className="flex items-center text-sm text-emerald-600">
                <CheckIcon className="w-4 h-4 mr-3" />
                Complete audit trails
              </div>
            </div>
          </div>
        </div>

        {/* Integrations Preview */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Seamless Integrations</h3>
          <p className="text-center text-gray-600 mb-8">
            Connect Feeta with your existing tools and workflows. Our AI co-pilot works with the platforms you already use.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="text-center">
              <h4 className="font-semibold text-gray-700 mb-3">Communication</h4>
              <div className="flex justify-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-700 mb-3">Development</h4>
              <div className="flex justify-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-700 mb-3">Project Tools</h4>
              <div className="flex justify-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-700 mb-3">Design</h4>
              <div className="flex justify-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          </div>
          <div className="bg-blue-600 text-white p-6 rounded-xl text-center">
            <p className="mb-4">Don't see your tool? We're constantly adding new integrations. Request yours and we'll prioritize it.</p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Request Integration
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
