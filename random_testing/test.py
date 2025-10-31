from openai import OpenAI
import json
import logging
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = OpenAI(
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key=os.getenv("GEMINI_API_KEY"),
    timeout=300,
)
with open("msg.json", "r") as f:
    messages = json.load(f)

with open("resf.json", "r") as f:
    response_format = json.load(f)

response = client.chat.completions.create(
    model="gemini-flash-latest",
    messages=messages,
    response_format=response_format,
    # temperature=0,
    reasoning_effort="low",
    stream=True,
)

# Stream the response
logger.info("Streaming response...")
full_content = ""
for chunk in response:
    if chunk.choices[0].delta.content:
        content = chunk.choices[0].delta.content
        print(content, end="", flush=True)
        full_content += content

print("\n")  # Add newline at the end
logger.info(f"Total characters received: {len(full_content)}")
