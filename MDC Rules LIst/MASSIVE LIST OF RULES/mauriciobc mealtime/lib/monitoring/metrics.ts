import { MetricType, MetricValue, MetricDefinition } from '@/types/monitoring';
import { Singleton } from '../utils/singleton';
import { logger } from './logger';

class MetricsMonitor extends Singleton<MetricsMonitor> {
  private metrics: Map<string, MetricDefinition>;

  public constructor() {
    super();
    this.metrics = new Map();
  }

  registerMetric(name: string, description: string, type: MetricType): void {
    if (this.metrics.has(name)) {
      logger.warn(`Métrica ${name} já registrada`);
      return;
    }

    const metric: MetricDefinition = {
      name,
      description,
      type,
      values: []
    };

    this.metrics.set(name, metric);
    logger.debug(`Métrica ${name} registrada`, { type, description });
  }

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Tentativa de registrar valor para métrica não existente: ${name}`);
      return;
    }

    const metricValue: MetricValue = {
      value,
      timestamp: new Date().toISOString(),
      labels
    };

    metric.values.push(metricValue);
    logger.debug(`Valor registrado para ${name}`, { value, labels });
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Tentativa de incrementar contador não existente: ${name}`);
      return;
    }

    if (metric.type !== 'counter') {
      logger.warn(`Tentativa de incrementar métrica não-contador: ${name}`);
      return;
    }

    this.recordMetric(name, 1, labels);
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Tentativa de definir gauge não existente: ${name}`);
      return;
    }

    if (metric.type !== 'gauge') {
      logger.warn(`Tentativa de definir valor em métrica não-gauge: ${name}`);
      return;
    }

    this.recordMetric(name, value, labels);
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Tentativa de observar histograma não existente: ${name}`);
      return;
    }

    if (metric.type !== 'histogram') {
      logger.warn(`Tentativa de observar métrica não-histograma: ${name}`);
      return;
    }

    this.recordMetric(name, value, labels);
  }

  getMetric(name: string): MetricDefinition | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }

  // Limpa valores antigos para evitar consumo excessivo de memória
  pruneOldValues(maxAge: number = 24 * 60 * 60 * 1000): void { // Padrão: 24 horas
    const now = new Date().getTime();
    
    for (const metric of this.metrics.values()) {
      metric.values = metric.values.filter(value => {
        const valueTime = new Date(value.timestamp).getTime();
        return now - valueTime <= maxAge;
      });
    }

    logger.debug('Valores antigos removidos das métricas');
  }
}

// Export a default instance
export const metricsMonitor = MetricsMonitor.getInstance(); 