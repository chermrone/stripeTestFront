import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var StripeTerminal: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'stripeFront';
  terminal: any;
  amount: number = 0;

  constructor(private http: HttpClient) {}

  // Initialisez le SDK Stripe Terminal
  ngOnInit() {
    this.terminal = StripeTerminal.create({
      onFetchConnectionToken: this.fetchConnectionToken,
      onUnexpectedReaderDisconnect: this.unexpectedDisconnect
    });
  }

  // Fonction pour récupérer le ConnectionToken depuis votre backend
  fetchConnectionToken = () => {
    return this.http.post('http://127.0.0.1:8000/api/connection_token', {}).toPromise()
      .then((response: any) => {
        console.log(response);
        return response.secret;
      });
  }

  // Fonction pour gérer les déconnexions inattendues du lecteur
  unexpectedDisconnect = () => {
    console.log('Déconnexion inattendue du lecteur');
  }

  discoverReaders() {
    this.terminal.discoverReaders({ simulated: false }).then((result: any) => {
      if (result.error) {
        console.log('Échec de la détection du lecteur : ', result.error);
      } else if (result.discoveredReaders.length === 0) {
        console.log('Aucun lecteur disponible.');
      } else {
        const selectedReader = result.discoveredReaders[0];
        this.terminal.connectReader(selectedReader).then((connectResult: any) => {
          if (connectResult.error) {
            console.log('Échec de la connexion au lecteur : ', connectResult.error);
          } else {
            console.log('Connecté au lecteur : ', connectResult.reader.label);
          }
        });
      }
    });
  }


  collectPayment(amount: number) {
    this.fetchPaymentIntentClientSecret(amount).then((client_secret: string) => {
      this.terminal.setSimulatorConfiguration({ testCardNumber: '4242424242424242' });
      this.terminal.collectPaymentMethod(client_secret).then((result: any) => {
        if (result.error) {
          // Gérez les erreurs
        } else {
          this.terminal.processPayment(result.paymentIntent).then((result: any) => {
            if (result.error) {
              console.log(result.error);
            } else if (result.paymentIntent) {
              const paymentIntentId = result.paymentIntent.id;
              // Traitez le paiement
            }
          });
        }
      });
    });
  }

  fetchPaymentIntentClientSecret(amount: number) {
    const bodyContent = { amount: amount };
    return this.http.post('/api/create_payment_intent', bodyContent).toPromise()
      .then((response: any) => {
        return response.client_secret;
      });
  }

}
