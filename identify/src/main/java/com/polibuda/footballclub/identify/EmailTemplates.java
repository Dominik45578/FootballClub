package com.polibuda.footballclub.identify;

public class EmailTemplates {

    // Kolory systemu (możesz dostosować do brandingu)
    private static final String COLOR_PRIMARY = "#007bff"; // Niebieski
    private static final String COLOR_BG = "#f4f4f4";      // Jasnoszary
    private static final String COLOR_TEXT = "#333333";    // Ciemnoszary

    /**
     * Szablon powitalny z kodem weryfikacyjnym
     */
    public static String generateEmailWithActivationCode(String username, String code) {
        String title = "Witaj w Football Club System!";
        String content = """
            <p>Cześć <strong>{{USERNAME}}</strong>,</p>
            <p>Dziękujemy za rejestrację w naszym systemie. Aby dokończyć proces zakładania konta, prosimy o zweryfikowanie adresu email.</p>
            <p>Twój kod aktywacyjny to:</p>
            <div style="background-color: #e9ecef; border-left: 5px solid {{COLOR}}; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">{{CODE}}</span>
            </div>
            <p>Kod jest ważny przez 15 minut. Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.</p>
            """
                .replace("{{USERNAME}}", username)
                .replace("{{CODE}}", code)
                .replace("{{COLOR}}", COLOR_PRIMARY);

        return wrapHtml(title, content);
    }

    /**
     * Szablon potwierdzenia aktywacji konta
     */
    public static String generateAccountActivatedEmail(String username) {
        String title = "Twoje konto jest aktywne";
        String content = """
            <p>Cześć <strong>{{USERNAME}}</strong>,</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 50px; color: #28a745;">&#10004;</span>
                <h3 style="margin-top: 10px; color: #28a745;">Sukces!</h3>
            </div>
            <p style="text-align: center;">Twoje konto zostało pomyślnie aktywowane.</p>
            <p style="text-align: center;">Możesz teraz zalogować się do systemu i korzystać ze wszystkich funkcji Football Club System.</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="#" style="background-color: {{COLOR}}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Przejdź do logowania</a>
            </div>
            """
                .replace("{{USERNAME}}", username)
                .replace("{{COLOR}}", COLOR_PRIMARY);

        return wrapHtml(title, content);
    }

    /**
     * Szablon przypomnienia o braku aktywacji (przy próbie logowania)
     */
    public static String generateAccountNotActiveEmail(String username) {
        String title = "Wymagana aktywacja konta";
        String content = """
            <p>Cześć <strong>{{USERNAME}}</strong>,</p>
            <div style="border: 1px solid #ffc107; background-color: #fff3cd; padding: 15px; border-radius: 5px; color: #856404; margin: 20px 0;">
                <strong>Uwaga:</strong> Zauważyliśmy próbę logowania na Twoje konto, ale nie zostało ono jeszcze aktywowane.
            </div>
            <p>Aby uzyskać dostęp do systemu, musisz najpierw potwierdzić swój adres email wpisując kod, który wysłaliśmy w poprzedniej wiadomości.</p>
            <p>Jeśli nie możesz znaleźć kodu, w aplikacji możesz poprosić o jego ponowne wysłanie.</p>
            """
                .replace("{{USERNAME}}", username);

        return wrapHtml(title, content);
    }

    /**
     * Szablon maila z kodem do resetowania hasła
     */
    public static String generatePasswordResetEmail(String username, String code) {
        String title = "Resetowanie hasła";
        String content = """
            <p>Cześć <strong>{{USERNAME}}</strong>,</p>
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Football Club System.</p>
            <p>Aby nadać nowe hasło, wprowadź poniższy kod weryfikacyjny:</p>
            
            <div style="background-color: #e9ecef; border-left: 5px solid {{COLOR}}; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">{{CODE}}</span>
            </div>
            
            <p>Kod jest ważny przez 10 minut.</p>
            
            <div style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 15px;">
                <strong>To nie Ty?</strong> Jeśli nie prosiłeś o zmianę hasła, zignoruj tę wiadomość i nie udostępniaj nikomu powyższego kodu. Twoje konto pozostaje bezpieczne.
            </div>
            """
                .replace("{{USERNAME}}", username)
                .replace("{{CODE}}", code)
                .replace("{{COLOR}}", COLOR_PRIMARY); // Użycie głównego koloru systemu

        return wrapHtml(title, content);
    }

    /**
     * Szablon alertu bezpieczeństwa po zmianie hasła
     */
    public static String generatePasswordChangedAlertEmail(String username) {
        String title = "Hasło zostało zmienione";
        String content = """
            <p>Cześć <strong>{{USERNAME}}</strong>,</p>
            <p>Informujemy, że hasło do Twojego konta w Football Club System zostało pomyślnie zmienione.</p>
            
            <div style="border: 1px solid #f5c6cb; background-color: #f8d7da; color: #721c24; padding: 20px; border-radius: 5px; margin: 25px 0;">
                <strong style="font-size: 16px;">⚠️ To nie Ty?</strong>
                <p style="margin: 10px 0 0 0; color: #721c24;">
                    Jeśli nie dokonywałeś tej zmiany, Twoje konto może być zagrożone. 
                    Skontaktuj się z administratorem systemu natychmiast.
                </p>
            </div>
            
            <p>Jeśli to Ty zmieniłeś hasło, możesz zignorować tę wiadomość.</p>
            """
                .replace("{{USERNAME}}", username);

        return wrapHtml(title, content);
    }

    /**
     * Metoda prywatna "opakowująca" treść w ładny layout (Header + Footer)
     */
    private static String wrapHtml(String title, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: {{BG_COLOR}}; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 40px; }
                    .header { text-align: center; border-bottom: 1px solid #eeeeee; padding-bottom: 20px; margin-bottom: 30px; }
                    .footer { text-align: center; font-size: 12px; color: #999999; margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px; }
                    h1 { color: {{TEXT_COLOR}}; font-size: 24px; margin: 0; }
                    p { color: #555555; line-height: 1.6; font-size: 16px; }
                </style>
            </head>
            <body>
                <div style="background-color: {{BG_COLOR}}; padding: 40px 0;">
                    <div class="container">
                        <div class="header">
                            <h1>Football Club System</h1>
                        </div>
                        
                        <!-- Główna treść -->
                        <h2 style="color: #333; font-size: 20px;">{{TITLE}}</h2>
                        {{CONTENT}}
                        <!-- Koniec głównej treści -->

                        <div class="footer">
                            <p>&copy; 2025 Football Club System. Wszelkie prawa zastrzeżone.</p>
                            <p>Wiadomość wygenerowana automatycznie. Prosimy na nią nie odpowiadać.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
                .replace("{{BG_COLOR}}", COLOR_BG)
                .replace("{{TEXT_COLOR}}", COLOR_TEXT)
                .replace("{{TITLE}}", title)
                .replace("{{CONTENT}}", bodyContent);
    }
}