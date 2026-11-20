import { useState } from 'react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react'

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'ayushargulwar77@gmail.com'

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
      success('Message sent!', `Our team will respond to ${form.email} within 24 hours.`)
    }, 800)
  }

  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Support &amp; Feedback</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            Contact <span className="gradient-text">Us</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Have questions about ClipForge AI, video processing quotas, or need technical support? Send us a message or email us directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details with simple mailto link */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Direct Email</h4>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-sm text-brand-400 hover:text-brand-300 underline font-medium block mt-1"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Click above to email us directly using your default email client. We respond within 1 business day.
              </p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <MessageSquare size={16} className="text-brand-400" />
                <span>Response Time</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard inquiries and deletion requests are acknowledged within 48 hours.
              </p>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card className="p-8">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Message Received</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Thank you for contacting us. We will get back to you shortly at {form.email}.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false)
                      setForm({ name: '', email: '', subject: '', message: '' })
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Your Name"
                      placeholder="e.g. Ayush"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <Input
                      label="Your Email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Subject"
                    placeholder="e.g. Question about 9:16 captions"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />

                  <TextArea
                    label="Message"
                    placeholder="How can we help you today?"
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />

                  <Button type="submit" size="lg" className="w-full gap-2 font-semibold" disabled={loading}>
                    <Send size={18} />
                    {loading ? 'Sending...' : 'Send Message'}
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
