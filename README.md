# Pharmacogenomics Dashboard

A production-ready Next.js application for patient management and drug-gene interaction analysis.

## Features

- **Patient Search**: Easily search and select patients from the database
- **Drug-Gene Interactions**: View comprehensive drug-gene interactions with risk assessments
- **Risk Assessment**: Visual indicators for High, Medium, and Low risk interactions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Full dark mode support using Tailwind CSS

## Technologies

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Type Safety**: TypeScript
- **Deployment**: Vercel

## Getting Started

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
# or
pnpm build
pnpm start
```

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles and design tokens
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main dashboard page
├── components/
│   ├── Header.tsx           # Header component
│   ├── PatientSearch.tsx    # Patient search component
│   └── DrugGeneInteractions.tsx # Drug-gene interactions display
├── types/
│   └── index.ts             # TypeScript type definitions
├── package.json             # Project dependencies
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── next.config.js           # Next.js configuration
```

## Mock Data

The application includes mock data for:
- 4 sample patients with medications
- Drug-gene interaction database with CYP450 genes
- Risk levels (High, Medium, Low)
- Clinical recommendations

## Design System

### Color Palette

- **Primary**: #0066cc (Blue)
- **Accent**: #00d4ff (Cyan)
- **Background**: White / #0a0a0a (Dark)
- **Foreground**: #1a1a1a / #f5f5f5 (Dark)
- **Border**: #e0e0e0 / #333333 (Dark)

### Typography

- **Font**: System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Font Sizes**: Responsive scaling
- **Line Height**: 1.5-1.6 for optimal readability

## Deployment

Deploy to Vercel with a single command:

```bash
vercel deploy
```

The application is optimized for Vercel's infrastructure and includes all necessary configurations.

## License

MIT
