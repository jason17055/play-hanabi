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
		out.writeStartArray();
		for (int i = 0; i < game.seats.size(); i++) {
			HanabiGame.Seat seat = game.seats.get(i);
			out.writeStartObject();
			out.writeStringField("seat", Integer.toString(i));
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
		out.writeEndArray(); //end seats

		out.writeFieldName("piles");
		out.writeStartObject();
		for (int i = 0; i < HanabiGame.SUIT_COUNT; i++) {
			HanabiGame.Card c = game.getPileTopCard(i);
			if (c != null) {
				out.writeStringField(c.getSuitName(), c.toString());
			}
		}
		out.writeEndObject(); // end piles

		out.writeFieldName("discards");
		out.writeStartArray();
		for (HanabiGame.Card c : game.discards) {
			out.writeString(c.toString());
		}
		out.writeEndArray();

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

		HanabiUser user = s.getUserBySession(sid);
		HanabiGame game = s.getGame(gameId);

		String message;
		if (action.equals("play_card")) {
			int slot = Integer.parseInt(req.getParameter("handSlot"));
			HanabiGame.PlayCardResult rv = game.playCard(slot);
			message = "It was a "+rv.card+"; "
				+ (rv.success ? "Success!" : "Oops!");
		}
		else if (action.equals("give_hint")) {
			doGiveHint(game, req, resp);
			return;
		}
		else {
			message = "don't know how to "+action;
		}

		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);

		out.writeStartObject();
		out.writeStringField("message", message);
		out.writeEndObject();
		out.close();
	}

	void doGiveHint(HanabiGame game, HttpServletRequest req, HttpServletResponse resp)
		throws IOException, ServletException
	{
		String target = req.getParameter("target");
		String hint = req.getParameter("hint");

		game.giveHint(target, hint);

		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);
		out.writeStartObject();
		out.writeStringField("message", "hint given; "+game.hintsLeft+" hints left");
		out.writeEndObject();
		out.close();
	}
}
