import Image from 'next/image';

const TrustBadges = () => {
  const tools = [
    { name: 'Slack', image: '/Images/slack.png' },
    { name: 'Jira', image: '/Images/jira.png' },
    { name: 'Asana', image: '/Images/asana.png' },
    { name: 'GitHub', image: '/Images/github.png' },
    { name: 'Calendar', image: '/Images/google-calendar.png' },
  ];
  
  return (
    <section className="py-12 px-6 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-gray-700 text-lg mb-8 font-medium">Integrate tools like</p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
          <div className="flex animate-scroll">
            {[...tools, ...tools].map((tool, i) => (
              <div key={i} className="flex-shrink-0 mx-8 flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-lg">
                <Image src={tool.image} alt={tool.name} width={32} height={32} className="object-contain" />
                <span className="text-gray-700 font-medium">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrustBadges
