package com.polibuda.footballclub.user.model;

public class UserEmailTemplates {

    private static final String COLOR_PRIMARY = "#007bff";
    private static final String COLOR_SUCCESS = "#28a745";
    private static final String COLOR_BG = "#f4f4f4";
    private static final String COLOR_TEXT = "#333333";

    public static String generateWelcomeMemberEmail(String firstName) {
        String title = "Witaj w gronie członków klubu!";
        String content = """
            <p>Cześć <strong>{{NAME}}</strong>,</p>
            <p>Twój profil członka został pomyślnie utworzony w systemie Football Club.</p>
            <div style="background-color: #e7f3ff; border-left: 5px solid {{COLOR}}; padding: 20px; margin: 25px 0;">
                <p style="margin: 0;">Teraz możesz dołączać do zespołów, śledzić swoje statystyki oraz uczestniczyć w życiu klubu.</p>
            </div>
            <p>Uzupełnij swój profil o dane dotyczące wzrostu i wagi, aby trenerzy mogli lepiej przygotować Twój plan treningowy.</p>
            """
                .replace("{{NAME}}", firstName)
                .replace("{{COLOR}}", COLOR_PRIMARY);
        return wrapHtml(title, content);
    }

    public static String generateJoinRequestSentEmail(String name, String teamName) {
        String title = "Prośba o dołączenie wysłana";
        String content = """
            <p>Cześć <strong>{{NAME}}</strong>,</p>
            <p>Twoja prośba o dołączenie do zespołu <strong>{{TEAM}}</strong> została zarejestrowana.</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 40px; color: {{COLOR}};">&#9203;</span>
                <p>Oczekiwanie na akceptację trenera</p>
            </div>
            <p>Poinformujemy Cię osobno, gdy tylko Twoja aplikacja zostanie rozpatrzona.</p>
            """
                .replace("{{NAME}}", name)
                .replace("{{TEAM}}", teamName)
                .replace("{{COLOR}}", COLOR_PRIMARY);
        return wrapHtml(title, content);
    }

    public static String generateMembershipApprovedEmail(String name, String teamName) {
        String title = "Zostałeś przyjęty do zespołu!";
        String content = """
            <p>Cześć <strong>{{NAME}}</strong>,</p>
            <div style="border: 1px solid #c3e6cb; background-color: #d4edda; color: #155724; padding: 20px; border-radius: 5px; margin: 25px 0; text-align: center;">
                <span style="font-size: 40px;">&#127935;</span>
                <h3 style="margin: 10px 0;">Witamy w składzie!</h3>
                <p>Twoja przynależność do <strong>{{TEAM}}</strong> jest już aktywna.</p>
            </div>
            <p>Możesz teraz sprawdzić szczegóły zespołu w swojej aplikacji.</p>
            """
                .replace("{{NAME}}", name)
                .replace("{{TEAM}}", teamName);
        return wrapHtml(title, content);
    }

    private static String wrapHtml(String title, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; background-color: {{BG_COLOR}}; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 40px auto; background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; border-bottom: 1px solid #eeeeee; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 style="color: {{TEXT_COLOR}}; margin: 0;">Football Club System</h1>
                    </div>
                    <h2 style="color: #333; font-size: 20px;">{{TITLE}}</h2>
                    {{CONTENT}}
                    <div style="text-align: center; font-size: 12px; color: #999999; margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        <p>&copy; 2026 Football Club System. Wiadomość automatyczna.</p>
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