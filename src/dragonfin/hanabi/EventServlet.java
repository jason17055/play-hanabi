package dragonfin.hanabi;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import com.fasterxml.jackson.core.*;

public class EventServlet extends HttpServlet
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
		String eventId = req.getParameter("event");

		HanabiUser user = s.getUserBySession(sid);
		HanabiGame game = s.getGame(gameId);

		HanabiEvent evt;
		try {
			evt = game.events.getEvent(Integer.parseInt(eventId), 10000);
		}
		catch (EventStream.EventNotFound e) {
			resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
			return;
		}

		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);
		out.writeStartObject();
		if (evt != null) {
			out.writeNumberField("eventId", evt.id);
			out.writeFieldName("event");
			evt.writeJsonFor(out, user);
		}
		out.writeFieldName("nextEvent");
		out.writeNumber((int)(evt != null ? (evt.id+1) : Integer.parseInt(eventId)));
		out.writeEndObject();
		out.close();
	}
}
