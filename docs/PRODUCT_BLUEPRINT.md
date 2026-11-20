# Product blueprint

## Product split

### Studio (owner workspace)
A private command center for the complete content lifecycle:
1. Series development and story bible
2. Script drafts, versions and continuity
3. Character profiles and visual references
4. Scene breakdown and storyboard
5. AI generation jobs for image, video, voice and music
6. Editing, captions, sound and quality checks
7. Owner approval
8. Publishing and release analytics

### Stream (viewer application)
A mobile-first vertical micro-series experience:
- Discovery feed with cover art and short trailers
- Series detail, episode list and vertical player
- Free and premium episode access
- Coins and subscription entitlements
- Watch progress and resume
- Analytics for retention and conversion

## Creative direction

The visual system supports mixed-format storytelling: photoreal live action, 2D animation and 3D animation. Each series has a visual bible and character reference set to preserve continuity. AI output is a draft until a human owner approves it.

## Commercial model

- Free opening episodes to reduce acquisition friction
- Premium episode unlocks using virtual coins
- Subscription tier for recurring revenue
- Optional rewarded ads after a later compliance and ad-provider review

Payments must be processed by a payment provider. Never store card data. Coin balances must be changed only by trusted server-side transactions and recorded in an immutable ledger.

## Release gate

An episode may be published only when:
- Required media assets exist
- Audio/video quality checks pass
- Captions and metadata are present
- Rights and safety checks are complete
- An owner approval record exists

## MVP sequence

1. Studio shell, database and owner authentication
2. Series, story bible, character, episode and script CRUD
3. Scene/storyboard workflow
4. Provider adapters and asynchronous generation jobs
5. Review queue and explicit approval gate
6. Stream app and playback delivery
7. Wallet, unlocks, subscriptions and analytics

The Studio series workspace now reads and writes series, story bibles, character profiles, episodes, versioned scripts and scenes through authenticated Supabase server actions. Gemini draft generation is optional and requires a server-side API key. Media generation, owner approval/release, public streaming, payments and analytics still require implementation and provider configuration.
