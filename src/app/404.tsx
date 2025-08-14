export default function NotFoundPage() {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: 'white',
          fontFamily: 'ui-sans-serif, system-ui',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>404</div>
            <div style={{ opacity: 0.8, marginTop: 8 }}>ページが見つかりません</div>
          </div>
        </div>
      </body>
    </html>
  );
}

