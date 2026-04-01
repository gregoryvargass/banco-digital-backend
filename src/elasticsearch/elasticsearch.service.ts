import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

type CustomerSearchDocument = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  isActive: boolean;
};

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly enabled: boolean;
  private readonly client: Client | null;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      this.configService.get<string>('ELASTICSEARCH_ENABLED') === 'true';

    if (!this.enabled) {
      this.client = null;
      this.logger.warn(
        'Elasticsearch integration is disabled by configuration.',
      );
      return;
    }

    const node =
      this.configService.get<string>('ELASTICSEARCH_NODE') ||
      'http://localhost:9200';

    this.client = new Client({ node });
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  async ensureCustomerIndex(): Promise<void> {
    if (!this.client) return;

    const index = 'customers';

    const exists = await this.client.indices.exists({ index });

    if (exists) return;

    await this.client.indices.create({
      index,
      mappings: {
        properties: {
          firstName: { type: 'text' },
          lastName: { type: 'text' },
          email: { type: 'keyword' },
          documentNumber: { type: 'keyword' },
          isActive: { type: 'boolean' },
        },
      },
    });

    this.logger.log('Elasticsearch index created: customers');
  }

  async indexCustomer(doc: CustomerSearchDocument): Promise<void> {
    if (!this.client) return;

    try {
      await this.ensureCustomerIndex();

      await this.client.index({
        index: 'customers',
        id: doc.id,
        document: doc,
        refresh: true,
      });

      this.logger.log(
        `Customer indexed in Elasticsearch -> customerId=${doc.id}`,
      );
    } catch (error: unknown) {
      console.log('ELASTICSEARCH BULK ERROR:', error);

      const message =
        error instanceof Error ? error.message : JSON.stringify(error, null, 2);

      this.logger.warn(
        `Elasticsearch bulk indexing failed -> reason=${message}`,
      );
    }
  }

  async bulkIndexCustomers(
    customers: CustomerSearchDocument[],
  ): Promise<boolean> {
    if (!this.client || customers.length === 0) {
      return false;
    }

    try {
      await this.ensureCustomerIndex();

      const operations = customers.flatMap((customer) => [
        { index: { _index: 'customers', _id: customer.id } },
        customer,
      ]);

      await this.client.bulk({
        refresh: true,
        operations,
      });

      this.logger.log(
        `Bulk indexed ${customers.length} customers in Elasticsearch`,
      );
      return true;
    } catch (error: unknown) {
      console.log('ELASTICSEARCH BULK ERROR:', error);

      const message =
        error instanceof Error ? error.message : JSON.stringify(error, null, 2);

      this.logger.warn(
        `Elasticsearch bulk indexing failed -> reason=${message}`,
      );

      return false;
    }
  }

  async searchCustomers(term: string): Promise<CustomerSearchDocument[]> {
    if (!this.client) {
      return [];
    }

    try {
      const result = await this.client.search<CustomerSearchDocument>({
        index: 'customers',
        query: {
          multi_match: {
            query: term,
            fields: ['firstName', 'lastName', 'email', 'documentNumber'],
          },
        },
      });

      return result.hits.hits
        .map((hit) => hit._source)
        .filter((doc): doc is CustomerSearchDocument => Boolean(doc));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown search error';

      this.logger.warn(
        `Elasticsearch search failed -> term="${term}", reason=${message}`,
      );

      return [];
    }
  }
}
