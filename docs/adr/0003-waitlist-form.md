# 3. The waitlist form

Date: 2026-09-29
Status: Accepted
Story: US-003

## Context

The landing built in US-002 makes an argument and then stops. Nothing on the
page lets a visitor act, so every reason to say yes is spent on nobody. US-003
adds the one thing the page was missing: a form that captures a lead.

It is the first component in this repo with real state — four of them, an HTTP
call that can fail, and two variants — and it is the one place on the site where
getting the accessibility wrong costs conversions rather than style points. This
record is about the decisions that are not obvious from reading the component.

The API it posts to does not exist yet: `POST /api/leads` is US-004. That
ordering is deliberate (the form is what proves the contract is worth building)
but it means this story's Definition of Done is front-end only. See
*Consequences*.

## Decisions

### 1. Three fields, and the third one depends on the side

Name, email, and then either the company name (required) or the role
(optional). Nothing else.

The ceiling is not taste, it is a promise already printed on the page: "Cómo
funciona" tells the visitor that leaving their email takes under a minute and
that we do not ask for anything else yet. A fourth field makes the section above
the form a lie, and the section above the form is what convinced them to scroll.

The company name is required because a company lead without a company is not
actionable. The candidate's role is optional because a candidate is the side
more likely to abandon, and we can ask later.

### 2. The submit button is never disabled for an invalid form

Only while a request is in flight.

A greyed-out submit button is the most common accessibility failure in a sign-up
form. It announces as "dimmed" and gives no reason; the visitor is left to guess
which field is the problem, and a screen-reader user often cannot find out at
all. Submitting is what reveals the errors, and that is the point: the button's
job is to answer the question "what is wrong", not to hide until nothing is.

### 3. Errors appear on the first submit, then update live

Not on blur, and not while typing.

Validating an email while somebody is halfway through typing it means telling
them it is wrong three times before it could possibly be right. Once they have
pressed the button, the contract changes: now they are fixing something, and the
message has to disappear the moment they fix it.

Making the second half work took a signal. Reactive-form state (`invalid`,
`errors`, `touched`) is plain mutable object state, and this app is zoneless
with `OnPush` components — nothing marks the view dirty when a control's
validity changes. `toSignal(form.valueChanges)`, read inside the `errors`
computed, is the subscription that makes the messages live. Without it the text
freezes at whatever it said on submit, and it does so silently.

### 4. Failure keeps the form; success replaces it

On failure the values stay exactly where they were and a `role="alert"` banner
explains what happened. Retrying must never mean retyping.

On success the form is replaced by a confirmation panel and **focus moves into
it**. A success message appended below a still-filled form is invisible to a
keyboard or screen-reader visitor: nothing announces, focus has not moved, and
the form still looks like it needs submitting. Focus is the announcement.

The `aria-live` region carries only "Enviando…". The confirmation is announced
by the focus move (richer — the visitor hears the whole panel and can read on)
and the failure by `role="alert"`, which is assertive and interrupts, which is
correct for an answer somebody is actively waiting for. The region itself is
always in the DOM: a live region added at the same moment its text appears is
announced by roughly half of screen readers and ignored by the rest.

### 5. `alreadyRegistered` instead of a 409

Posting the same address twice is a success, not an error. The response carries
`alreadyRegistered`, and the UI says "ya estabas en la lista" rather than
congratulating somebody twice for doing nothing.

This is what makes US-004's idempotency visible instead of merely correct, and
it is why the flag is in the contract rather than being inferred from a status
code. It also gives the API somewhere to put the truth when a retry follows a
timeout the client never saw the answer to.

### 6. A honeypot, and an explicit statement of what it does not do

A field no human can reach — off-screen, `tabindex="-1"`, inside an
`aria-hidden` wrapper. Any value in it means the submission is not a person, and
the form answers exactly as if it had worked while sending nothing. A bot that
is told it was caught is a bot that gets rewritten.

It is `position: absolute; left: -9999px`, deliberately not `display: none` and
not `visibility: hidden`: the cheapest scrapers skip both, and those are exactly
the population this catches.

**It is a filter, not a fence.** It stops nothing that posts straight at
`/api/leads`. Server-side rate limiting is US-004's, and this record exists
partly so that requirement does not get lost in the handoff between the two
stories.

### 7. Radios for the variant picker, with the `name` written out by hand

Two mutually exclusive options that both have to stay visible is a radiogroup,
and arrow-key navigation inside it is behaviour the browser gives for free.

Except it did not. Angular's radio value accessor left the `name` attribute
**empty** on both inputs, and an empty name means the browser never forms a
group: each radio became its own tab stop, and arrow-key selection changed the
DOM without the value ever reaching the form control — the field below simply
did not swap. Nothing failed. No error, no warning, and the click path worked
perfectly, which is what a developer tests.

Writing `name="kind"` on both inputs fixes it. The value has to match the
`formControlName` exactly or Angular throws `NG01202` — and **that check only
runs in dev mode**, so `ng build` passed on a mismatched name and only
`ng test` caught it. Both halves of that are now guarded by a test.

This one was found by rendering the page in Chromium and pressing the arrow key,
not by reading the code. It is the second story in a row where that is true.

### 8. Both hero buttons now point at the form

They pointed at `#empresas` and `#candidatos` while there was no form to send
anyone to. Now they both point at `#lista-de-espera` and differ only in wording:
the form's first question is which side you are on, so routing them separately
would only mean asking the same thing twice. Preselecting the variant from the
fragment is a query-param feature dressed up as a hash, and it is not worth it
for one radio button.

## Consequences

* **This story is Done as front end only.** `ng build` and `ng test` pass and the
  four states were rendered and measured in Chromium. The form cannot be
  exercised end to end until US-004 provides `POST /api/leads` and US-006 wires
  the environments and CORS. Until then it will fail in production with a
  network error and the message in decision 4 — which is the honest behaviour,
  but it is a reason not to announce the landing yet.
* **US-004 inherits two requirements from this record**: the contract in
  `src/app/api/Leads/ILead.ts` (including `alreadyRegistered`), and server-side
  rate limiting, because the honeypot does not cover a direct post.
* **The form collects personal data that the privacy notice already promises to
  delete on request**, and that promise names `SITE_INFO.contactEmail`, which is
  still the placeholder from OPS-6. The form makes that impediment more
  expensive, not less: it is now a page that collects addresses while offering a
  deletion channel that bounces.
* `_layout.scss` gained nothing. The form's controls are used once, on one page,
  so they live in the component. When a second form appears, the input and the
  label move up — not before.
