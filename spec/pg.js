
import pg from 'pg';

export default class Pg {

  disconnect() {
    if (this.clientDone) {
      this.clientDone();
    }
    this.client = null;
    this.clientDone = null;
  }

  async connect(url) {
    this.client = null;
    this.clientDone = null;
    return new Promise((resolve, reject) => {
      pg.connect(url, (err, client, clientDone) => {
        if (err) {
          reject(err);
          return;
        }
        this.client = client;
        this.clientDone = clientDone;
        resolve(this);
      });
    });
  }

  async query(sql) {
    return new Promise((resolve, reject) => {
      this.client.query(sql, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  async values(sql) {
    return (await this.query(sql)).rows[0];
  }

  async value(sql) {
    const values = await this.values(sql);
    const key = Object.keys(values)[0];
    return values[key];
  }

}
