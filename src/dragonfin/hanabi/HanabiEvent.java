package dragonfin.hanabi;

import java.io.*;
import com.fasterxml.jackson.core.*;

public class HanabiEvent
{
	int id;
	String message;

	HanabiEvent(String message)
	{
		this.message = message;
	}

	protected HanabiEvent()
	{
	}

	public void writeJsonFor(JsonGenerator out, HanabiUser user)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("message", message);
		out.writeEndObject();
	}
}
