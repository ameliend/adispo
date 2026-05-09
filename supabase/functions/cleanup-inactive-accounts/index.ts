import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://adispo.fr'
const FROM_EMAIL = 'ADispo <noreply@adispo.fr>'

// Inactivity is measured from last_sign_in_at (or created_at if never logged in).
const WARNING_MONTHS = 23
const DELETE_MONTHS = 24

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function frenchDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function sendWarningEmail(email: string, deleteDate: Date) {
  if (!RESEND_API_KEY) {
    console.log(`[DRY RUN] Warning email to ${email} — delete on ${frenchDate(deleteDate)}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: `Votre compte ADispo sera supprimé le ${frenchDate(deleteDate)}`,
      html: `
        <p>Bonjour,</p>
        <p>Votre compte ADispo est inactif depuis plus de 23 mois.</p>
        <p>Conformément à notre politique de conservation des données (24 mois d'inactivité),
           il sera <strong>supprimé automatiquement le ${frenchDate(deleteDate)}</strong>.</p>
        <p>Pour conserver votre compte, il vous suffit de
           <a href="${APP_URL}/connexion">vous connecter avant cette date</a>.
           Une simple connexion renouvelle la période de conservation.</p>
        <p>Si vous n'utilisez plus ADispo, aucune action n'est nécessaire.</p>
        <br>
        <p>L'équipe ADispo</p>
        <p style="font-size:12px;color:#666;">
          Vous recevez cet email car vous avez créé un compte sur
          <a href="${APP_URL}">adispo.fr</a>.
        </p>
      `,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const now = new Date()
  const warningThreshold = addMonths(now, -WARNING_MONTHS)
  const deleteThreshold = addMonths(now, -DELETE_MONTHS)

  let warned = 0
  let deleted = 0
  const errors: string[] = []

  // Fetch all warned user IDs to avoid duplicate emails
  const { data: warnedRows } = await supabase
    .from('account_deletion_warnings')
    .select('user_id')
  const warnedIds = new Set((warnedRows ?? []).map((r) => r.user_id))

  // Paginate through all users (1000 per page)
  let page = 1
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })
    if (error) { errors.push(`listUsers page ${page}: ${error.message}`); break }
    if (!users || users.length === 0) break

    for (const user of users) {
      const lastActive = user.last_sign_in_at
        ? new Date(user.last_sign_in_at)
        : new Date(user.created_at!)

      if (lastActive <= deleteThreshold) {
        // 24+ months inactive → delete account
        const { error: delErr } = await supabase.auth.admin.deleteUser(user.id)
        if (delErr) {
          errors.push(`Delete ${user.email}: ${delErr.message}`)
        } else {
          console.log(`Deleted inactive account: ${user.email} (last active: ${lastActive.toISOString()})`)
          deleted++
        }
      } else if (lastActive <= warningThreshold && !warnedIds.has(user.id)) {
        // 23+ months inactive, not yet warned → send warning email
        const deleteDate = addMonths(lastActive, DELETE_MONTHS)
        try {
          await sendWarningEmail(user.email!, deleteDate)
          await supabase
            .from('account_deletion_warnings')
            .upsert({ user_id: user.id })
          console.log(`Warned: ${user.email} (delete on ${frenchDate(deleteDate)})`)
          warned++
        } catch (e) {
          errors.push(`Warn ${user.email}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    if (users.length < 1000) break
    page++
  }

  const summary = { warned, deleted, errors }
  console.log('Cleanup complete:', JSON.stringify(summary))
  if (errors.length) console.error('Errors:', errors)

  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  })
})
