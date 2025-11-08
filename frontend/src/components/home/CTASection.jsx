const CTASection = () => {
  return (
    <section className="py-20 px-6 bg-blue-600 text-white text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-bold mb-6">
          Ready to Transform Your Project Execution?
        </h1>
        <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
          Join thousands of teams who've already revolutionized how they work. Start your free trial today 
          and experience the power of AI-driven project management.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            Start Your Free Trial
          </button>
          <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200">
            Watch Demo
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm opacity-90">
          <span>14-day free trial</span>
          <span>•</span>
          <span>No credit card required</span>
          <span>•</span>
          <span>Cancel anytime</span>
        </div>
      </div>
    </section>
  )
}

export default CTASection
