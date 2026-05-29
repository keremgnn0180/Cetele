import React from 'react';
import CrashScreen from './CrashScreen';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Renderer crash captured:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <CrashScreen
          title="Ekran yüklenemedi"
          message="Arayüz tarafında bir hata yakalandı. Veritabanı işlemleri durduruldu ve güvenli yenileme öneriliyor."
          onRetry={() => this.setState({ error: null })}
        />
      );
    }

    return this.props.children;
  }
}
