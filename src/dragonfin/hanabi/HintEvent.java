package dragonfin.hanabi;

import java.io.*;
import com.fasterxml.jackson.core.*;

public class HintEvent extends HanabiEvent
{
	int actor;
	HanabiGame.Seat actorSeat;
	int target;
	HanabiGame.HintType hintType;
	String hint;
	boolean [] applies;

	HintEvent()
	{
	}

	@Override
	public void writeJsonFor(JsonGenerator out, HanabiUser user)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("event", "hint");
		out.writeStringField("actor", Integer.toString(actor));
		out.writeStringField("target", Integer.toString(target));
		out.writeStringField("hintType", hintType.name());
		out.writeStringField("hint", hint);
		if (applies != null) {
			out.writeFieldName("applies");
			out.writeStartArray();
			int count = 0;
			for (int slot = 0; slot < applies.length; slot++) {
				out.writeString(applies[slot] ? "Y" : "N");
				count += (applies[slot] ? 1 : 0);
			}
			out.writeEndArray();
			out.writeNumberField("count", count);
		}
		out.writeStringField("message", actorSeat.user.name + " has given a hint");
		out.writeEndObject();
	}
}
