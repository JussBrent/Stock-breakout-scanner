import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function PricingPreview() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for learning the platform',
      features: [
        '1 default scan per day',
        'Top 10 Focus List results',
        'Basic AI strength scores',
        'Email support'
      ],
      cta: 'Start Free',
      featured: false
    },
    {
      name: 'Standard',
      price: '$49',
      period: '/month',
      description: 'For active breakout traders',
      features: [
        'Unlimited default scans',
        'Full Focus List access',
        'Advanced AI analytics',
        '5 custom scan profiles',
        'Real-time alerts',
        'Priority support'
      ],
      cta: 'Get Started',
      featured: true
    },
    {
      name: 'Premium',
      price: '$99',
      period: '/month',
      description: 'For professional traders',
      features: [
        'Everything in Standard',
        'Unlimited custom scans',
        'API access',
        'Export & integrations',
        'Multi-account support',
        'Dedicated support'
      ],
      cta: 'Get Started',
      featured: false
    }
  ]

  return (
    <section className="relative overflow-hidden py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <h2 className="mb-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Choose your plan
          </h2>
          <p className="text-base text-muted-foreground">
            Start free, upgrade when you need more power
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden border-border/60 bg-card/80 p-8 backdrop-blur-sm transition-all hover:border-border hover:shadow-xl ${
                tier.featured
                  ? 'ring-2 ring-foreground lg:scale-105'
                  : ''
              }`}
            >
              {tier.featured && (
                <div className="absolute right-6 top-6 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="mb-2 font-serif text-2xl font-semibold">
                  {tier.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="font-serif text-5xl font-semibold">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                )}
              </div>
              <Button
                className={`mb-8 w-full rounded-full py-6 font-medium ${
                  tier.featured ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
                variant={tier.featured ? 'default' : 'secondary'}
              >
                {tier.cta}
              </Button>
              <ul className="space-y-3">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex gap-3 text-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 shrink-0 text-foreground"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
