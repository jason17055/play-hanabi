package dragonfin.hanabi;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import com.fasterxml.jackson.core.*;

public class GameServlet extends HttpServlet
{
	HanabiServer s;

	@Override
	public void init()
		throws ServletException
	{
		s = (HanabiServer) getServletContext().getAttribute("hanabi");
		if (s == null) {
			throw new ServletException("HanabiServer not available");
		}
	}

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
		throws IOException, ServletException
	{
		String sid = req.getParameter("sid");
		String gameId = req.getParameter("game");

		HanabiUser user = s.getUserBySession(sid);
		HanabiGame game = s.getGame(gameId);

		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);

		out.writeStartObject();
		out.writeStringField("id", gameId);
		out.writeNumberField("drawPile", game.drawPile.size());
		out.writeNumberField("hintsLeft", game.hintsLeft);
		out.writeNumberField("errorsMade", game.errorsMade);

		out.writeFieldName("seats");
		out.writeStartObject();
		for (int i = 0; i < game.seats.size(); i++) {
			HanabiGame.Seat seat = game.seats.get(i);
			out.writeFieldName(Integer.toString(i));
			out.writeStartObject();
			out.writeStringField("playerName", seat.user.name);
			if (seat.user == user) {
				out.writeBooleanField("isYou", true);
			}
			out.writeFieldName("hand");
			out.writeStartArray();
			for (HanabiGame.Card c : seat.hand) {
				if (seat.user == user) {
					out.writeString("unknown");
				}
				else {
					out.writeString(c.toString());
				}
			}
			out.writeEndArray();
			out.writeEndObject();
		}
		out.writeEndObject(); //end seats

		out.writeFieldName("piles");
		out.writeStartObject();
		for (int i = 0; i < HanabiGame.SUIT_COUNT; i++) {
			HanabiGame.Card c = game.getPileTopCard(i);
			if (c != null) {
				out.writeStringField(c.getSuitName(), c.toString());
			}
		}
		out.writeEndObject(); // end piles

		out.writeEndObject(); // end game
		out.close();
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
		throws IOException, ServletException
	{
		String sid = req.getParameter("sid");
		String gameId = req.getParameter("game");
		String action = req.getParameter("action");
		int slot = Integer.parseInt(req.getParameter("handSlot"));

		HanabiUser user = s.getUserBySession(sid);
		HanabiGame game = s.getGame(gameId);

		String message;
		if (action.equals("play_card")) {
			HanabiGame.PlayCardResult rv = game.playCard(slot);
			message = "It was a "+rv.card+"; "
				+ (rv.success ? "Success!" : "Oops!");
		}
		else {
			message = "Don't know how to "+action;
		}

		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);

		out.writeStartObject();
		out.writeStringField("message", message);
		out.writeEndObject();
		out.close();
	}
}
