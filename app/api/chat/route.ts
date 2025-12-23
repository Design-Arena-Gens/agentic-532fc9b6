import { NextResponse } from 'next/server'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Appointment {
  name?: string
  email?: string
  phone?: string
  date?: string
  time?: string
  service?: string
  notes?: string
}

const AVAILABLE_SERVICES = [
  'Consultation',
  'Follow-up Meeting',
  'Technical Support',
  'Sales Demo',
  'Training Session',
  'Strategy Meeting'
]

const AVAILABLE_TIMES = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
]

function extractAppointmentInfo(messages: Message[], currentAppointment: Partial<Appointment>): { appointment: Partial<Appointment>, response: string } {
  const lastUserMessage = messages[messages.length - 1].content.toLowerCase()
  const appointment = { ...currentAppointment }
  let needsInfo: string[] = []

  // Extract service
  if (!appointment.service) {
    for (const service of AVAILABLE_SERVICES) {
      if (lastUserMessage.includes(service.toLowerCase())) {
        appointment.service = service
        break
      }
    }
  }

  // Extract name
  if (!appointment.name) {
    const nameMatch = lastUserMessage.match(/(?:name is|i'm|i am|my name's)\s+([a-z]+(?:\s+[a-z]+)?)/i)
    if (nameMatch) {
      appointment.name = nameMatch[1].split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    }
  }

  // Extract email
  if (!appointment.email) {
    const emailMatch = lastUserMessage.match(/[\w.-]+@[\w.-]+\.\w+/)
    if (emailMatch) {
      appointment.email = emailMatch[0]
    }
  }

  // Extract phone
  if (!appointment.phone) {
    const phoneMatch = lastUserMessage.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s?\d{3}[-.\s]?\d{4})/)
    if (phoneMatch) {
      appointment.phone = phoneMatch[0]
    }
  }

  // Extract date
  if (!appointment.date) {
    const dateMatch = lastUserMessage.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i)
    if (dateMatch) {
      appointment.date = dateMatch[0]
    } else if (lastUserMessage.includes('tomorrow')) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      appointment.date = tomorrow.toLocaleDateString()
    } else if (lastUserMessage.includes('today')) {
      appointment.date = new Date().toLocaleDateString()
    }
  }

  // Extract time
  if (!appointment.time) {
    const timeMatch = lastUserMessage.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i)
    if (timeMatch) {
      appointment.time = timeMatch[0]
    }
  }

  // Determine what information is still needed
  if (!appointment.service) needsInfo.push('service')
  if (!appointment.name) needsInfo.push('name')
  if (!appointment.email) needsInfo.push('email')
  if (!appointment.phone) needsInfo.push('phone number')
  if (!appointment.date) needsInfo.push('preferred date')
  if (!appointment.time) needsInfo.push('preferred time')

  // Generate response
  let response = ''

  if (needsInfo.length === 0) {
    response = `Perfect! I have all the information I need. Let me confirm your appointment:\n\n` +
      `📅 Service: ${appointment.service}\n` +
      `👤 Name: ${appointment.name}\n` +
      `📧 Email: ${appointment.email}\n` +
      `📱 Phone: ${appointment.phone}\n` +
      `📆 Date: ${appointment.date}\n` +
      `🕐 Time: ${appointment.time}\n\n` +
      `Your appointment has been scheduled! You'll receive a confirmation email shortly. Is there anything else I can help you with?`
  } else if (needsInfo.length === 6) {
    // Just starting
    response = `Great! I'd be happy to help you schedule an appointment. We offer the following services:\n\n` +
      AVAILABLE_SERVICES.map((s, i) => `${i + 1}. ${s}`).join('\n') +
      `\n\nWhich service are you interested in?`
  } else {
    // Need some information
    const justReceived = []
    if (appointment.service && !currentAppointment.service) justReceived.push('service')
    if (appointment.name && !currentAppointment.name) justReceived.push('name')
    if (appointment.email && !currentAppointment.email) justReceived.push('email')
    if (appointment.phone && !currentAppointment.phone) justReceived.push('phone')
    if (appointment.date && !currentAppointment.date) justReceived.push('date')
    if (appointment.time && !currentAppointment.time) justReceived.push('time')

    if (justReceived.length > 0) {
      response = `Thank you! `
    }

    if (needsInfo.includes('name')) {
      response += `Could you please provide your full name?`
    } else if (needsInfo.includes('email')) {
      response += `What's your email address?`
    } else if (needsInfo.includes('phone number')) {
      response += `What's the best phone number to reach you?`
    } else if (needsInfo.includes('preferred date')) {
      response += `What date works best for you?`
    } else if (needsInfo.includes('preferred time')) {
      response += `What time would you prefer? We have availability from 9:00 AM to 5:00 PM.`
    }
  }

  return { appointment, response }
}

export async function POST(request: Request) {
  try {
    const { messages, appointment: currentAppointment } = await request.json()

    const { appointment, response } = extractAppointmentInfo(messages, currentAppointment || {})

    return NextResponse.json({
      message: response,
      appointment
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { message: 'Sorry, I encountered an error processing your request.' },
      { status: 500 }
    )
  }
}
