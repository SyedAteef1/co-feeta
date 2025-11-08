import { Header, Footer } from '@/components/layout'
import { 
  HeroSection, 
  TrustBadges, 
  ProblemSolutionSection, 
  HowItWorksSection, 
  FeaturesSection, 
  CTASection 
} from '@/components/home'
import { Integrations } from '@/components/integrations/Integrations'
import ModernHome from './modernhome/page'

export default function Home() {
  return (
    <div className="min-h-screen font-inter bg-white">
      <ModernHome/>

      </div>
  )
}
