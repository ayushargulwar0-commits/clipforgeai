import { useState } from 'react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { Mail, MessageSquare, MapPin, Send, CheckCircle2 } from 'lucide-react'

export default function Contact() {
  const { success } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      success('Message sent!', 'Our team will respond to your email within 24 hours.')
    }, 1000)
  }

  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Support & Partnerships</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Have a question about the platform, API integrations, enterprise volume, or need support? Send us a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Email Us</h4>
                  <p className="text-xs text-slate-400">hello@clipforge.ai</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">We reply within 1 business day.</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Community</h4>
                  <p className="text-xs text-slate-400">Discord & GitHub</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Join fellow creators and developers.</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent-600/20 text-accent-400 flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Headquarters</h4>
                  <p className="text-xs text-slate-400">Bangalore, India</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Serving creators globally.</p>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card className="p-8">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Thank you for reaching out!</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Your inquiry has been received. One of our specialists will get back to you shortly.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Your Name"
                      placeholder="Jane Doe"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="jane@example.com"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Subject"
                    placeholder="E.g., Creator plan inquiry or feedback"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                  <TextArea
                    label="Message"
                    rows={5}
                    placeholder="Tell us about your project or what you need assistance with..."
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                  <Button type="submit" loading={loading} className="w-full gap-2 font-semibold">
                    <Send size={16} /> Send Message
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
