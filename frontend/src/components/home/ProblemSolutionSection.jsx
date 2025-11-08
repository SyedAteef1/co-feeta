import { CheckIcon, XIcon } from '../ui/Icons'

const ProblemSolutionSection = () => {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Problems */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-gray-900">
              Project Management Shouldn't Be This Complicated
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                  <XIcon className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-gray-600 text-lg">Hours spent creating detailed project plans and task breakdowns</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                  <XIcon className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-gray-600 text-lg">Team members unclear on priorities and next steps</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                  <XIcon className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-gray-600 text-lg">Projects stalling due to poor delegation and follow-up</p>
              </div>
            </div>
          </div>
          
          {/* Solutions */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-gray-900">
              Feeta Makes It Simple
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                  <CheckIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-gray-600 text-lg">Unified workspace connecting all your favorite tools</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                  <CheckIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-gray-600 text-lg">Smart task delegation with human-in-the-loop approval</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                  <CheckIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-gray-600 text-lg">Automated progress tracking and intelligent insights</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-16">
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Transform your project ideas into executed reality in three simple steps. Our AI co-pilot handles 
            the complexity while you maintain full human-in-the-loop control.
          </p>
        </div>
      </div>
    </section>
  )
}

export default ProblemSolutionSection
