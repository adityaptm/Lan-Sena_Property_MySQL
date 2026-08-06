class SupabaseQueryBuilder {
  private tableName: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: any[] = [];
  private limitCount?: number;
  private singleResult: boolean = false;
  private selectColumns: string = '*';
  private payload: any = null;
  private orderField?: string;
  private orderAscending: boolean = true;
  private isMutation: boolean = false; // true after insert/update/delete

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    // If chained after insert/update/delete (e.g. .insert().select()),
    // don't change the action — mutation already returns data.
    if (!this.isMutation) {
      this.action = 'select';
      this.selectColumns = columns;
    }
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'insert';
    this.payload = data;
    this.isMutation = true;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    this.isMutation = true;
    return this;
  }

  delete() {
    this.action = 'delete';
    this.isMutation = true;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  or(filterStr: string) {
    this.filters.push({ type: 'or', value: filterStr });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderField = column;
    this.orderAscending = ascending;
    return this;
  }

  async then(onfulfilled?: (value: any) => any) {
    try {
      let body: any = {
        action: this.action,
        table: this.tableName,
        filters: this.filters,
        limit: this.limitCount,
        single: this.singleResult,
        orderField: this.orderField,
        orderAscending: this.orderAscending,
      };

      if (this.action === 'select') {
        body.select = this.selectColumns;
      } else if (this.action === 'insert') {
        // Backend /api/db kita menerima SATU object per insert (bukan array).
        // Supabase asli selalu mengirim insert sebagai array — kita TIDAK
        // meniru itu di sini, supaya kontraknya konsisten dengan backend kita.
        // Kalau caller kebetulan kirim array 1 elemen, bongkar dulu di sini
        // supaya tetap kompatibel dan tidak bikin error "Unknown column".
        this.payload = Array.isArray(this.payload) ? this.payload[0] : this.payload;
        body.data = this.payload;
      } else if (this.action === 'update') {
        body.data = this.payload;
      }

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.error) {
        const errorVal = { data: null, error: { message: result.error } };
        return onfulfilled ? onfulfilled(errorVal) : errorVal;
      }

      // Backend mengembalikan satu object langsung untuk insert (bukan array
      // berisi 1 elemen seperti Supabase asli), jadi result.data sudah dalam
      // bentuk yang benar — tidak perlu di-index [0] lagi.
      const dataVal = result.data;

      const val = { data: dataVal, error: null };
      return onfulfilled ? onfulfilled(val) : val;
    } catch (err: any) {
      const errorVal = { data: null, error: { message: err.message } };
      return onfulfilled ? onfulfilled(errorVal) : errorVal;
    }
  }
}

const auth = {
  async getUser() {
    try {
      const res = await fetch('/api/auth/user');
      const result = await res.json();
      if (result.error || !result.user) return { data: { user: null }, error: result.error };
      return { data: { user: result.user }, error: null };
    } catch (err) {
      return { data: { user: null }, error: err };
    }
  },
  async signInWithPassword({ email, password }: any) {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (result.error) return { data: null, error: { message: result.error } };
      return { data: { user: result.user, session: result.session }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
  async signUp({ email, password }: any) {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (result.error) return { data: null, error: { message: result.error } };
      return { data: { user: result.user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
  async signOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  },
};

export function createClient() {
  return {
    from(tableName: string) {
      return new SupabaseQueryBuilder(tableName);
    },
    auth,
  };
}