import NextErrorComponent from 'next/error'

export default function NotFoundComponent() {
  return <NextErrorComponent statusCode={404}/>
}