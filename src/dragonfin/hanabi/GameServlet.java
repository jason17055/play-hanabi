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
		out.writeEndObject();
		out.close();
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
		throws IOException, ServletException
	{
		String sid = req.getParameter("sid");
		String gameId = req.getParameter("game");
		String action = req.getParameter("action");
		String slot = req.getParameter("handSlot");

		HanabiUser user = s.getUserBySession(sid);
		HanabiGame game = s.getGame(gameId);

		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);

		out.writeStartObject();
		out.writeStringField("message", "that was a "+action);
		out.writeEndObject();
		out.close();
	}
}
